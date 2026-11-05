// src/services/query.service.js
import axios from 'axios';
import { ObjectId } from 'mongodb';
import { environment } from '../config/environment.js';
import { queryStatus } from '../constants/queryStatus.js';
import queryRepositoryInstance from '../repositories/query.repository.js';
import recommendationRepositoryInstance from '../repositories/recommendation.repository.js';
import studentRepositoryInstance from '../repositories/student.repository.js';
import { BadRequestError } from '../errors/badRequestError.js';
import logger from '../utils/logger.js';

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
        if (!question || question.trim() === '') {
            throw new BadRequestError('La pregunta no puede estar vacía.');
        }

        // Obtener datos frescos del estudiante si existen
        let currentLevel = studentLevel;
        let currentArea = studentAreaOfInterest;

        try {
            const student = await this.studentRepository.findById(studentId);
            if (student) {
                currentLevel = student.level || currentLevel;
                currentArea = student.areaOfInterest || currentArea;
            }
        } catch {
            // Continuamos con los datos del JWT si la consulta a DB es omitida
        }

        // 1. RF 07: Registrar la consulta en estado inicial "Pendiente" antes de llamar a la IA
        const initialQuery = await this.queryRepository.create({
            studentId,
            question,
            status: queryStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const queryId = String(initialQuery._id);
        logger.info(`Consulta registrada con ID: ${queryId} en estado ${queryStatus.PENDING}`);

        try {
            // 2. RF 08: Enviar a n8n el ID, pregunta, nivel y área de interés
            const n8nPayload = {
                queryId,
                question,
                experienceLevel: currentLevel,
                interestArea: currentArea
            };

            const n8nResponse = await this._callN8nWebhook(n8nPayload);

            // 3. Procesar resultados según similitud y presencia de fuentes (RF 10, 11, 13)
            const sources = n8nResponse.sources || n8nResponse.courses || [];
            const answer = n8nResponse.answer || n8nResponse.response || 'No se encontraron recomendaciones aplicables.';

            let finalStatus = queryStatus.ANSWERED;

            // RF 11: Si ningún curso supera el umbral o la lista viene vacía
            if (!sources || sources.length === 0) {
                finalStatus = queryStatus.NO_RESULTS;
            }

            // 4. RF 14: Almacenar la recomendación con sus fuentes y similitudes
            const recommendation = await this.recommendationRepository.create({
                queryId,
                studentId,
                answer,
                sources: sources.map(src => ({
                    courseId: src.id || src.courseId || src._id,
                    title: src.title || src.name,
                    description: src.description,
                    category: src.category,
                    similarity: src.similarity || src.score || 0
                })),
                status: finalStatus,
                createdAt: new Date()
            });

            // 5. Actualizar el estado final de la consulta
            await this.queryRepository.updateById(queryId, {
                status: finalStatus,
                updatedAt: new Date()
            });

            logger.info(`Consulta ${queryId} finalizada con estado: ${finalStatus}`);

            // RF 13: Respuesta estandarizada hacia el frontend
            return {
                queryId,
                question,
                answer,
                sources: recommendation.sources,
                status: finalStatus,
                createdAt: initialQuery.createdAt
            };

        } catch (error) {
            logger.error(`Fallo en el flujo RAG para la consulta ${queryId}:`, error.message);

            // Regla de Negocio: Si n8n, Qdrant o Gemini fallan, la consulta debe finalizar como Error
            await this.queryRepository.updateById(queryId, {
                status: queryStatus.ERROR,
                errorMessage: error.message,
                updatedAt: new Date()
            });

            return {
                queryId,
                question,
                answer: 'Lo sentimos, ocurrió un error al procesar tu recomendación con la Inteligencia Artificial.',
                sources: [],
                status: queryStatus.ERROR
            };
        }
    }

    /**
     * Consulta el historial completo del estudiante (RF 16)
     */
    async getStudentHistory(studentId) {
        return await this.queryRepository.findWithPagination(
            { studentId },
            50,
            1,
            { createdAt: -1 }
        );
    }

    /**
     * Despacha la petición HTTP al Webhook de n8n
     * @private
     */
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
            timeout: 30000 // 30 segundos de tolerancia para RAG + LLM
        });

        return response.data;
    }
}