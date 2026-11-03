import { environment } from '../config/environment.js';
import { queryStatus } from '../constants/queryStatus.js';
import { AppError } from '../errors/appError.js';
import { logger } from '../utils/logger.js';

export class QueryService {
    /**
     * Constructor con inyección de dependencias.
     * @param {Object} queryRepository - Repositorio de consultas.
     */
    constructor(queryRepository = null) {
        this.queryRepository = queryRepository;
    }

    /**
     * Procesa la consulta del usuario a través del proxy del Backend hacia n8n.
     * @param {Object} askQueryDto - DTO con los datos de la pregunta
     */
    async processQuery(askQueryDto) {
        const { prompt, userId = null, userRole = 'anonymous', courseId = null } = askQueryDto;

        const initialQueryData = {
            prompt,
            userId,
            userRole,
            courseId,
            status: queryStatus.PENDING,
            response: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const savedQuery = await this.queryRepository.create(initialQueryData);

        try {
            const response = await fetch(environment.n8n.chatWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queryId: savedQuery._id,
                    prompt,
                    userRole,
                    userId,
                    courseId,
                }),
            });

            if (!response.ok) {
                throw new AppError(`Error en la automatización n8n: ${response.statusText}`, 502);
            }

            const n8nResult = await response.json();

            const updatePayload = {
                status: queryStatus.COMPLETED,
                response: n8nResult.output || n8nResult.response || n8nResult.message,
                metadata: n8nResult.metadata || {},
                updatedAt: new Date(),
            };

            return await this.queryRepository.updateById(savedQuery._id, updatePayload);
        } catch (error) {
            logger.error(`Error en proxy n8n para queryId ${savedQuery._id}:`, error);

            await this.queryRepository.updateById(savedQuery._id, {
                status: queryStatus.FAILED,
                error: error.message,
                updatedAt: new Date(),
            });

            throw new AppError('No se pudo obtener respuesta del servicio de inteligencia artificial.', 500);
        }
    }

    /**
     * Registra la calificación otorgada por el usuario a una respuesta de la IA.
     * @param {Object} rateQueryDto - DTO validado de la calificación
     */
    async rateQuery(rateQueryDto) {
        const { queryId, score, comment = '' } = rateQueryDto;

        if (!this.queryRepository) {
            throw new AppError('Repositorio no configurado en QueryService.', 500);
        }

        const ratingData = {
            queryId,
            score,
            comment,
            ratedAt: new Date(),
        };

        // Invoca al repositorio para registrar la calificación
        return await this.queryRepository.addRating(queryId, ratingData);
    }
}

// Exportación por defecto obligatoria para que los test de Vitest e instanciaciones por defecto no fallen
export default QueryService;