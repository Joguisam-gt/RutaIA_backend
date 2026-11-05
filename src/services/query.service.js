// src/services/query.service.js
import axios from 'axios';
import { environment } from '../config/environment.js';
import { queryStatus } from '../constants/queryStatus.js';
import queryRepositoryInstance from '../repositories/query.repository.js';
import recommendationRepositoryInstance from '../repositories/recommendation.repository.js';
import studentRepositoryInstance from '../repositories/student.repository.js';
import BadRequestErrorImport from '../errors/badRequestError.js';
import AppErrorImport from '../errors/appError.js';
import logger from '../utils/logger.js';

// Compatibilidad de importación resiliente
const BadRequestError = BadRequestErrorImport?.BadRequestError || BadRequestErrorImport || AppErrorImport || Error;

export default class QueryService {
    constructor(
        queryRepository = queryRepositoryInstance,
        recommendationRepository = recommendationRepositoryInstance,
        studentRepository = studentRepositoryInstance
    ) {
        this.queryRepository = queryRepository;
        this.recommendationRepository = recommendationRepository;
        this.studentRepository = studentRepository;
    }

    /**
     * Ejecuta el ciclo de vida completo de la consulta inteligente (RF 06 al RF 14)
     * Soporta tanto usuarios autenticados como usuarios invitados (Guest).
     */
    async processQuery({ studentId, question, studentLevel, studentAreaOfInterest }) {
        if (!question || typeof question !== 'string' || question.trim() === '') {
            throw new BadRequestError('La pregunta no puede estar vacía.');
        }

        let currentLevel = studentLevel || 'Principiante';
        let currentArea = studentAreaOfInterest || 'Tecnología';
        let validStudentId = studentId || null;

        // 1. Manejo del estudiante: Si es un usuario registrado o guest
        try {
            if (this.studentRepository) {
                if (validStudentId) {
                    const student = await this.studentRepository.findById(validStudentId);
                    if (student) {
                        currentLevel = student.level || currentLevel;
                        currentArea = student.areaOfInterest || currentArea;
                    }
                } else {
                    // Si es Guest y la BD exige un estudiante relacionado, intentamos enlazar al primer estudiante registrado
                    const fallbackStudent = await this.studentRepository.findOne?.({}) || null;
                    if (fallbackStudent) {
                        validStudentId = fallbackStudent._id || fallbackStudent.id || null;
                    }
                }
            }
        } catch (stdError) {
            logger.warn('Aviso al recuperar perfil de estudiante:', stdError.message);
        }

        // 2. RF 07: Registrar en estado Pendiente antes de invocar n8n / Gemini
        let initialQuery = null;
        try {
            const queryData = {
                question: question.trim(),
                status: queryStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Solo incluimos studentId si tenemos uno válido para no romper la validación de Mongoose
            if (validStudentId) {
                queryData.studentId = validStudentId;
            }

            initialQuery = await this.queryRepository.create(queryData);
        } catch (dbError) {
            logger.warn('No se pudo persistir la consulta previa en MongoDB (continuando en memoria):', dbError.message);
        }

        const queryId = String(initialQuery?._id || initialQuery?.id || `temp_${Date.now()}`);
        logger.info(`Consulta registrada con ID: ${queryId} en estado ${queryStatus.PENDING}`);

        try {
            // 3. RF 08: Enviar a n8n el ID, pregunta, nivel y área
            const n8nPayload = {
                queryId,
                question: question.trim(),
                experienceLevel: currentLevel,
                interestArea: currentArea
            };

            const n8nResponse = await this._callN8nWebhook(n8nPayload);

            // Normalizar respuesta de n8n (maneja si n8n retorna un array [ { ... } ] o un objeto directo)
            const payloadData = Array.isArray(n8nResponse) ? n8nResponse[0] : n8nResponse;

            // 4. Procesar fuentes y estado (RF 10, 11, 13)
            const rawSources = payloadData?.sources || payloadData?.courses || [];
            const answer = payloadData?.answer || payloadData?.response || 'No se encontraron recomendaciones aplicables.';

            const formattedSources = Array.isArray(rawSources) ? rawSources.map(src => ({
                courseId: src.id || src.courseId || src._id,
                title: src.title || src.name || 'Curso recomendado',
                description: src.description || '',
                category: src.category || 'General',
                similarity: Number(src.similarity || src.score || 0)
            })) : [];

            // RF 11: Si no hay fuentes relevantes, finalizar como Sin resultados
            const finalStatus = formattedSources.length > 0 
                ? queryStatus.ANSWERED 
                : queryStatus.NO_RESULTS;

            // 5. RF 14: Persistir recomendación si existe el repositorio
            if (this.recommendationRepository?.create) {
                try {
                    await this.recommendationRepository.create({
                        queryId,
                        ...(validStudentId && { studentId: validStudentId }),
                        answer,
                        sources: formattedSources,
                        status: finalStatus,
                        createdAt: new Date()
                    });
                } catch (recError) {
                    logger.warn('Aviso: No se pudo guardar en la colección recommendations:', recError.message);
                }
            }

            // 6. Actualizar estado final de la consulta si se guardó previamente
            if (initialQuery?._id || initialQuery?.id) {
                try {
                    await this.queryRepository.updateById(queryId, {
                        status: finalStatus,
                        updatedAt: new Date()
                    });
                } catch (updError) {
                    logger.warn('Aviso: No se pudo actualizar estado en queries:', updError.message);
                }
            }

            logger.info(`Consulta ${queryId} finalizada con estado: ${finalStatus}`);

            return {
                queryId,
                question: question.trim(),
                answer,
                sources: formattedSources,
                status: finalStatus,
                createdAt: initialQuery?.createdAt || new Date()
            };

        } catch (error) {
            logger.error(`Fallo en el flujo RAG para la consulta ${queryId}:`, error.message);

            // Regla de Negocio: Si n8n, Qdrant o Gemini fallan, la consulta finaliza como Error
            if (initialQuery?._id || initialQuery?.id) {
                try {
                    await this.queryRepository.updateById(queryId, {
                        status: queryStatus.ERROR,
                        errorMessage: error.message,
                        updatedAt: new Date()
                    });
                } catch {
                    // Ignora fallos de actualización secundaria
                }
            }

            return {
                queryId,
                question: question.trim(),
                answer: 'Lo sentimos, ocurrió un error al procesar tu recomendación con la Inteligencia Artificial.',
                sources: [],
                status: queryStatus.ERROR
            };
        }
    }

    /**
     * Consulta el historial de un estudiante específico (RF 16)
     */
    async getStudentHistory(studentId) {
        if (!studentId) return [];

        try {
            return await this.queryRepository.findWithPagination(
                { studentId },
                50,
                1,
                { createdAt: -1 }
            );
        } catch (error) {
            logger.error(`Error al recuperar historial del estudiante ${studentId}:`, error.message);
            return [];
        }
    }

    /**
     * Comunicación segura vía HTTP con el Webhook de n8n (RF 08)
     */
    async _callN8nWebhook(payload) {
        const webhookUrl = 
            environment?.n8n?.chatWebhookUrl || 
            environment?.n8nChatWebhookUrl || 
            process.env.N8N_WEBHOOK_URL_CHAT ||
            process.env.N8N_CHAT_WEBHOOK_URL;

        if (!webhookUrl) {
            throw new Error('La URL del Webhook de n8n no está configurada en las variables de entorno.');
        }

        const sharedSecret = 
            environment?.n8n?.sharedSecret || 
            process.env.N8N_SHARED_SECRET || 
            '';

        const headers = {
            'Content-Type': 'application/json'
        };

        if (sharedSecret) {
            headers['X-Shared-Secret'] = sharedSecret;
        }

        const response = await axios.post(webhookUrl, payload, {
            headers,
            timeout: 360000
        });

        return response.data;
    }
}