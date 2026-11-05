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

// Compatibilidad de importación (default o nombrada)
const BadRequestError = BadRequestErrorImport?.BadRequestError || BadRequestErrorImport || AppErrorImport;

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
     */
    async processQuery({ studentId, question, studentLevel, studentAreaOfInterest }) {
        if (!question || typeof question !== 'string' || question.trim() === '') {
            throw new BadRequestError('La pregunta no puede estar vacía.');
        }

        let currentLevel = studentLevel || 'Principiante';
        let currentArea = studentAreaOfInterest || 'Tecnología';

        try {
            if (this.studentRepository && studentId) {
                const student = await this.studentRepository.findById(studentId);
                if (student) {
                    currentLevel = student.level || currentLevel;
                    currentArea = student.areaOfInterest || currentArea;
                }
            }
        } catch {
            // Se continúa con los valores por defecto
        }

        // 1. RF 07: Registrar en estado Pendiente antes de invocar la IA
        const initialQuery = await this.queryRepository.create({
            studentId,
            question: question.trim(),
            status: queryStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const queryId = String(initialQuery?._id || 'temp_id');
        logger.info(`Consulta registrada con ID: ${queryId} en estado ${queryStatus.PENDING}`);

        try {
            // 2. RF 08: Enviar a n8n el ID, pregunta, nivel y área
            const n8nPayload = {
                queryId,
                question: question.trim(),
                experienceLevel: currentLevel,
                interestArea: currentArea
            };

            const n8nResponse = await this._callN8nWebhook(n8nPayload);

            // 3. Procesar fuentes y estado (RF 10, 11, 13)
            const rawSources = n8nResponse?.sources || n8nResponse?.courses || [];
            const answer = n8nResponse?.answer || n8nResponse?.response || 'No se encontraron recomendaciones aplicables.';

            const formattedSources = rawSources.map(src => ({
                courseId: src.id || src.courseId || src._id,
                title: src.title || src.name,
                description: src.description,
                category: src.category,
                similarity: src.similarity || src.score || 0
            }));

            // RF 11: Si no hay fuentes, estado Sin resultados
            const finalStatus = formattedSources.length > 0 
                ? queryStatus.ANSWERED 
                : queryStatus.NO_RESULTS;

            // 4. RF 14: Persistir recomendación si existe repositorio
            if (this.recommendationRepository?.create) {
                try {
                    await this.recommendationRepository.create({
                        queryId,
                        studentId,
                        answer,
                        sources: formattedSources,
                        status: finalStatus,
                        createdAt: new Date()
                    });
                } catch (recError) {
                    logger.warn('No se pudo guardar en recommendations collection:', recError.message);
                }
            }

            // 5. Actualizar estado final de la consulta
            await this.queryRepository.updateById(queryId, {
                status: finalStatus,
                updatedAt: new Date()
            });

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

            // Regla de Negocio: Si n8n o la IA fallan, la consulta debe finalizar como Error
            await this.queryRepository.updateById(queryId, {
                status: queryStatus.ERROR,
                errorMessage: error.message,
                updatedAt: new Date()
            });

            return {
                queryId,
                question: question.trim(),
                answer: 'Lo sentimos, ocurrió un error al procesar tu recomendación con la Inteligencia Artificial.',
                sources: [],
                status: queryStatus.ERROR
            };
        }
    }

    async getStudentHistory(studentId) {
        return await this.queryRepository.findWithPagination(
            { studentId },
            50,
            1,
            { createdAt: -1 }
        );
    }

    async _callN8nWebhook(payload) {
        const webhookUrl = environment.n8n.chatWebhookUrl || environment.n8nChatWebhookUrl;

        if (!webhookUrl) {
            throw new Error('La URL del Webhook de n8n (N8N_WEBHOOK_URL_CHAT) no está configurada.');
        }

        const response = await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shared-Secret': environment.n8n.sharedSecret
            },
            timeout: 30000
        });

        return response.data;
    }
}