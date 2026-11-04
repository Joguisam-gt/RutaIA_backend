// src/services/query.service.js
import { environment } from '../config/environment.js';
import { AppError } from '../errors/appError.js';
import { logger } from '../utils/logger.js';
import { ObjectId } from 'mongodb';

export class QueryService {
    constructor(queryRepository = null) {
        this.queryRepository = queryRepository;
    }

    _toValidObjectId(id) {
        if (id && ObjectId.isValid(id)) {
            return new ObjectId(id);
        }
        return new ObjectId('000000000000000000000000');
    }

    async processQuery(askQueryDto) {
        const webhookUrl = environment.n8n.chatWebhookUrl;

        if (!webhookUrl) {
            throw new AppError('La URL del webhook de n8n no está configurada.', 503);
        }

        const { prompt, userQuery, studentId, userId, userRole = 'anonymous', courseId } = askQueryDto;
        const queryText = prompt || userQuery;

        if (!queryText || typeof queryText !== 'string' || queryText.trim().length < 3) {
            throw new AppError('La pregunta debe tener al menos 3 caracteres.', 400);
        }

        const initialQueryData = {
            studentId: this._toValidObjectId(studentId || userId),
            userQuery: queryText.trim(),
            status: 'PENDIENTE',
            aiResponse: null,
            errorMessage: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        let savedQuery = null;
        if (this.queryRepository && typeof this.queryRepository.create === 'function') {
            savedQuery = await this.queryRepository.create(initialQueryData);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 360000);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    queryId: savedQuery?._id || null,
                    prompt: queryText,
                    userRole,
                    userId: String(studentId || userId || 'anonymous_session'),
                    courseId: courseId || 'general'
                })
            });

            clearTimeout(timeoutId);

            const rawText = await response.text();
            logger.info(`[n8n Response HTTP ${response.status}]: ${rawText}`);

            if (!response.ok) {
                throw new AppError(`El webhook de n8n respondió con estado ${response.status}: ${rawText}`, 502);
            }

            let n8nResult = {};
            try {
                n8nResult = JSON.parse(rawText);
            } catch {
                n8nResult = { output: rawText };
            }

            let payload = n8nResult;
            if (Array.isArray(payload) && payload.length > 0) {
                payload = payload[0];
            }

            const aiAnswer =
                payload?.output ||
                payload?.response ||
                payload?.text ||
                payload?.message ||
                payload?.json?.output ||
                payload?.json?.response ||
                (typeof payload === 'string' ? payload : null);

            if (!aiAnswer) {
                throw new AppError(`Estructura de respuesta no válida recibida desde n8n: ${rawText}`, 502);
            }

            // Actualización en base de datos sin sobrescribir el retorno al frontend
            if (savedQuery && this.queryRepository?.updateById) {
                await this.queryRepository.updateById(savedQuery._id, {
                    status: 'RESPONDIDA',
                    aiResponse: String(aiAnswer),
                    updatedAt: new Date()
                });
            }

            // Estructura limpia garantizada para el Frontend
            return {
                _id: savedQuery?._id || null,
                userQuery: queryText,
                status: 'RESPONDIDA',
                aiResponse: String(aiAnswer),
                createdAt: initialQueryData.createdAt
            };

        } catch (error) {
            clearTimeout(timeoutId);
            logger.error(`Error procesando query ${savedQuery?._id || ''}:`, error);

            const isTimeout = error.name === 'AbortError';
            const errorMsg = isTimeout ? 'Timeout en el servicio de IA (6 minutos)' : error.message;

            if (savedQuery && this.queryRepository?.updateById) {
                await this.queryRepository.updateById(savedQuery._id, {
                    status: 'ERROR',
                    errorMessage: errorMsg,
                    updatedAt: new Date()
                });
            }

            if (isTimeout) {
                throw new AppError('El servicio de IA excedió el tiempo máximo de espera.', 504);
            }

            throw error instanceof AppError ? error : new AppError(error.message || 'No se pudo obtener respuesta del servicio de IA.', 500);
        }
    }
}

export default QueryService;