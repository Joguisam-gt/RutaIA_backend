import { environment } from '../config/environment.js';
import { queryStatus } from '../constants/queryStatus.js';
import { AppError } from '../errors/appError.js';
import { logger } from '../utils/logger.js';

export class QueryService {
    /**
     * Inyección de dependencias mediante el constructor.
     * @param {Object} queryRepository - Repositorio que hereda de BaseRepository para persistencia en MongoDB.
     */
    constructor(queryRepository) {
        this.queryRepository = queryRepository;
    }

    /**
     * Procesa la pregunta del usuario utilizando el backend como proxy seguro hacia n8n.
     * @param {Object} askQueryDto - Datos validados de la consulta (prompt, userId, role, etc.)
     * @returns {Object} Respuesta procesada por la IA y registrada en MongoDB.
     */
    async processQuery(askQueryDto) {
        const { prompt, userId, userRole = 'anonymous', courseId } = askQueryDto;

        // 1. Persistencia Inicial (Atómica): Registro de la consulta en estado PENDING
        const initialQueryData = {
            prompt,
            userId: userId || null,
            userRole,
            courseId: courseId || null,
            status: queryStatus.PENDING,
            response: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Guarda el registro inicial en MongoDB
        const savedQuery = await this.queryRepository.create(initialQueryData);

        try {
            // 2. Patrón Proxy: Invocación interna desde el servidor Node.js hacia el Webhook de n8n
            const n8nPayload = {
                queryId: savedQuery._id,
                prompt,
                userRole,
                userId: userId || 'anonymous',
                courseId: courseId || 'general',
            };

            logger.info(`Enviando petición proxy a n8n para queryId: ${savedQuery._id}`);

            // Realiza la petición HTTP hacia n8n
            const response = await fetch(environment.n8n.chatWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(n8nPayload),
            });

            if (!response.ok) {
                throw new AppError(`Error en el servicio de automatización n8n: ${response.statusText}`, 502);
            }

            const n8nResult = await response.json();

            // 3. Actualización de Registro: Guarda la respuesta obtenida de la IA y actualiza el estado a COMPLETED
            const updatePayload = {
                status: queryStatus.COMPLETED,
                response: n8nResult.output || n8nResult.response || n8nResult.message,
                metadata: n8nResult.metadata || {},
                updatedAt: new Date(),
            };

            const updatedQuery = await this.queryRepository.updateById(savedQuery._id, updatePayload);

            return {
                queryId: updatedQuery._id,
                prompt: updatedQuery.prompt,
                response: updatedQuery.response,
                status: updatedQuery.status,
                createdAt: updatedQuery.createdAt,
            };

        } catch (error) {
            logger.error(`Error durante la ejecución del proxy n8n para queryId ${savedQuery._id}:`, error);

            // En caso de fallo en n8n o timeout, se actualiza el registro a FAILED para mantener consistencia en auditorías
            await this.queryRepository.updateById(savedQuery._id, {
                status: queryStatus.FAILED,
                error: error.message,
                updatedAt: new Date(),
            });

            throw new AppError('No se pudo obtener respuesta del servicio de inteligencia artificial. Intente nuevamente.', 500);
        }
    }

    /**
     * Obtiene el historial de consultas filtrado por usuario.
     */
    async getUserQueryHistory(userId) {
        if (!userId) {
            throw new AppError('El ID de usuario es obligatorio para consultar el historial.', 400);
        }
        return await this.queryRepository.find({ userId });
    }
}