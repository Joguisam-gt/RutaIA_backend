import axios from 'axios';
import FormData from 'form-data';
import { N8N_WEBHOOK_URL_INGEST, N8N_WEBHOOK_URL_CHAT, N8N_SHARED_SECRET } from '../config/environment.js';
import ServiceUnavailableError from '../errors/serviceUnavailableError.js';
import logger from '../utils/logger.js';

export default class RecommendationService {
    constructor(httpClient = axios) {
        this.httpClient = httpClient;
        this.ingestWebhookUrl = N8N_WEBHOOK_URL_INGEST;
        this.chatWebhookUrl = N8N_WEBHOOK_URL_CHAT;
        this.sharedSecret = N8N_SHARED_SECRET;
    }

    _buildHeaders(extraHeaders = {}) {
        return {
            'x-api-key': this.sharedSecret,
            ...extraHeaders
        };
    }

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

    async sendUserQuery(studentId, userRole, queryText, selectedCategory) {
        try {
            const payload = {
                userId: studentId.toString(),
                role: userRole,
                message: queryText,
                selectedCategory: selectedCategory || null,
                timestamp: new Date().toISOString()
            };

            const response = await this.httpClient.post(this.chatWebhookUrl, payload, {
                headers: this._buildHeaders({ 'Content-Type': 'application/json' }),
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            logger.error('Error de comunicación con el Webhook de Chat en n8n:', error.message);
            throw new ServiceUnavailableError('El asistente de Inteligencia Artificial no está respondiendo en este momento.');
        }
    }
}