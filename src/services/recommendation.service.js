// src/services/recommendation.service.js
import axios from 'axios';
import FormData from 'form-data';
import { N8N_WEBHOOK_URL_INGEST, N8N_WEBHOOK_URL_CHAT, N8N_SHARED_SECRET } from '../config/environment.js';
import queryRepositoryInstance from '../repositories/query.repository.js';
import QueryStatus from '../constants/queryStatus.js';
import ServiceUnavailableError from '../errors/serviceUnavailableError.js';
import QueryResponseDTO from '../dtos/query/queryResponse.dto.js';
import logger from '../utils/logger.js';

/**
 * Servicio orientado a objetos encargados de la comunicación con n8n y la gestión del ciclo
 * de vida del estado de la recomendación en MongoDB (SRP, DIP & OCP).
 */
export default class RecommendationService {
    /**
     * Inyección de dependencias a través del constructor.
     *  Instancia del repositorio de consultas.
     * Cliente HTTP (Axios por defecto).
     */
    constructor(
        queryRepository = queryRepositoryInstance,
        httpClient = axios
    ) {
        this.queryRepository = queryRepository;
        this.httpClient = httpClient;
        this.ingestWebhookUrl = N8N_WEBHOOK_URL_INGEST;
        this.chatWebhookUrl = N8N_WEBHOOK_URL_CHAT;
        this.sharedSecret = N8N_SHARED_SECRET;
    }

    /**
     * Construye las cabeceras de seguridad Servidor a Servidor con la clave secreta.
     */
    _buildHeaders(extraHeaders = {}) {
        return {
            'x-api-key': this.sharedSecret,
            ...extraHeaders
        };
    }

    /**
     * Procesa la consulta del usuario ejecutando el ciclo completo de estado (PENDIENTE -> RESPONDIDA/SIN_RESULTADOS/ERROR).
     *  ID del estudiante.
     *  Rol del usuario.
     *  DTO con la pregunta validada.
     *  DTO con la respuesta y fuentes vectoriales.
     */
    async processUserQueryAndPersist(studentId, userRole, queryDto) {
        // 1. Registro inicial en MongoDB con estado PENDIENTE
        const initialQueryData = {
            studentId,
            userQuery: queryDto.question,
            category: queryDto.category || null,
            status: QueryStatus.PENDIENTE,
            aiResponse: null,
            vectorSources: [],
            similarityScore: null,
            recommendedCourseIds: []
        };

        const initialRecord = await this.queryRepository.create(initialQueryData);
        logger.info(`Consulta registrada en MongoDB (ID: ${initialRecord._id}) en estado PENDIENTE. Enviando petición a n8n...`);

        // 2. Construcción de la carga útil HTTP para n8n
        const payload = {
            queryId: initialRecord._id.toString(),
            userId: studentId.toString(),
            role: userRole,
            message: queryDto.question,
            selectedCategory: queryDto.category || null,
            timestamp: new Date().toISOString()
        };

        try {
            // 3. Envío HTTP POST al webhook del chat de n8n con timeout de 30s
            const response = await this.httpClient.post(this.chatWebhookUrl, payload, {
                headers: this._buildHeaders({ 'Content-Type': 'application/json' }),
                timeout: 30000
            });

            const aiData = response.data || {};
            const sources = aiData.vectorSources || aiData.sources || [];
            const recommendedCourses = aiData.recommendedCourseIds || [];

            // 4. Determinación dinámica de estado según los resultados RAG recuperados
            const finalStatus = (sources.length > 0 || recommendedCourses.length > 0 || (aiData.responseText && !aiData.noResults))
                ? QueryStatus.RESPONDIDA
                : QueryStatus.SIN_RESULTADOS;

            // 5. Persistencia de la recomendación final y actualización de estado
            const updatePayload = {
                aiResponse: aiData.responseText || aiData.message || 'No se obtuvieron recomendaciones para esta consulta.',
                vectorSources: sources,
                similarityScore: typeof aiData.similarityScore === 'number' ? aiData.similarityScore : null,
                recommendedCourseIds: recommendedCourses,
                status: finalStatus
            };

            const updatedRecord = await this.queryRepository.updateById(initialRecord._id, updatePayload);
            logger.info(`Consulta ID: ${initialRecord._id} actualizada con éxito al estado: ${finalStatus}`);

            return QueryResponseDTO.fromEntity(updatedRecord);

        } catch (error) {
            // 6. Manejo de timeouts o caídas de red: Marcado de estado a ERROR
            logger.error(`Fallo en la comunicación con n8n para la consulta ID: ${initialRecord._id}. Detalle: ${error.message}`);

            await this.queryRepository.updateById(initialRecord._id, {
                status: QueryStatus.ERROR,
                errorMessage: error.message
            });

            throw new ServiceUnavailableError('El motor de Inteligencia Artificial (n8n) no respondió a tiempo. Intente de nuevo más tarde.');
        }
    }

    /**
     * Retransmite el archivo PDF y sus metadatos al Webhook de Ingesta en n8n.
     *  ID del curso en MongoDB.
     *  Contenido binario del archivo.
     *  Nombre del archivo PDF.
     *  Tipo MIME (application/pdf).
     *  Metadatos asociados al curso.
     *  Respuesta del proceso de embeddings en n8n.
     */
    async processCoursePdf(courseId, fileBuffer, fileName, mimeType, courseMetadata) {
        try {
            const form = new FormData();

            form.append('file', fileBuffer, {
                filename: fileName,
                contentType: mimeType
            });
            form.append('courseId', courseId.toString());
            form.append('title', courseMetadata.title);
            form.append('category', courseMetadata.category);
            form.append('level', courseMetadata.level);
            form.append('graphNodeId', courseMetadata.graphNodeId || '');

            const response = await this.httpClient.post(this.ingestWebhookUrl, form, {
                headers: this._buildHeaders(form.getHeaders()),
                timeout: 60000
            });

            return response.data;
        } catch (error) {
            logger.error('Error de comunicación con el Webhook de Ingesta en n8n:', error.message);
            throw new ServiceUnavailableError('El motor de Inteligencia Artificial (n8n) no se encuentra disponible para procesar el documento.');
        }
    }
}