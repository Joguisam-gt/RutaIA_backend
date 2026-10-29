// src/controllers/metric.controller.js
import MetricService from '../services/metric.service.js';

/**
 * Controlador orientado a objetos para exponer métricas agregadas del sistema (SRP & DIP).
 * Recopila y entrega información consolidada sobre usuarios, rendimiento de la IA y estadísticas del catálogo
 * exclusivamente para el panel de control del Administrador.
 */
export default class MetricController {
    /**
     * Inyección de dependencias a través del constructor.
     */
    constructor(metricService = new MetricService()) {
        this.metricService = metricService;

        // Preservación explícita del contexto 'this' para Express
        this.getSystemMetrics = this.getSystemMetrics.bind(this);
        this.getAIRecommendationMetrics = this.getAIRecommendationMetrics.bind(this);
        this.getCourseMetrics = this.getCourseMetrics.bind(this);
    }

    /**
     * Obtiene la vista general del panel con indicadores globales del sistema.
     * Ruta: GET /api/v1/metrics/dashboard
     * Permisos: Exclusivo Administrador
     */
    async getSystemMetrics(req, res, next) {
        try {
            const overview = await this.metricService.getDashboardOverview();

            return res.status(200).json({
                success: true,
                data: overview
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene estadísticas detalladas sobre el rendimiento y estados de las interacciones con n8n.
     * Ruta: GET /api/v1/metrics/ai-recommendations
     * Permisos: Exclusivo Administrador
     */
    async getAIRecommendationMetrics(req, res, next) {
        try {
            const aiMetrics = await this.metricService.getAIMetrics();

            return res.status(200).json({
                success: true,
                data: aiMetrics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene métricas agregadas del catálogo de cursos (promedios de calificación, visibilidad y cursos más recomendados).
     * Ruta: GET /api/v1/metrics/courses
     * Permisos: Exclusivo Administrador
     */
    async getCourseMetrics(req, res, next) {
        try {
            const courseStats = await this.metricService.getCourseStats();

            return res.status(200).json({
                success: true,
                data: courseStats
            });
        } catch (error) {
            next(error);
        }
    }
}