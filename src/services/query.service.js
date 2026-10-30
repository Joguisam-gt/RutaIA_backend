// src/services/query.service.js
import queryRepositoryInstance from '../repositories/query.repository.js';
import RecommendationService from './recommendation.service.js';

/**
 * Servicio orientado a objetos para la gestión de consultas hacia la IA (SRP & DIP).
 */
export default class QueryService {
    /**
     * Inyección de dependencias a través del constructor.
     * Instancia del repositorio de consultas.
     * Instancia del servicio de recomendaciones RAG/n8n.
     */
    constructor(
        queryRepository = queryRepositoryInstance,
        recommendationService = new RecommendationService()
    ) {
        this.queryRepository = queryRepository;
        this.recommendationService = recommendationService;
    }

    /**
     * Procesa la consulta enviada por el estudiante y la retransmite al webhook de n8n.
     */
    async executeStudentQuery(studentId, userRole, queryDto) {
        return await this.recommendationService.processUserQueryAndPersist(studentId, userRole, queryDto);
    }

    /**
     * Obtiene el historial paginado de conversaciones de un estudiante.
     */
    async getStudentHistory(studentId, limit = 20, page = 1) {
        return await this.queryRepository.findByStudentId(studentId, limit, page);
    }

    /**
     * Obtiene métricas agregadas de uso de la IA para el panel de administración.
     */
    async getAdminMetrics() {
        return await this.queryRepository.getMetricsSummary();
    }
}