// src/controllers/query.controller.js
import QueryService from '../services/query.service.js';

/**
 * Controlador orientado a objetos para atender las consultas del estudiante hacia la IA (SRP & DIP).
 * Funciona como conector enviando preguntas a n8n y devolviendo las recomendaciones al frontend.
 */
export default class QueryController {
    /**
     * Inyección de dependencias en el constructor.
     */
    constructor(queryService = new QueryService()) {
        this.queryService = queryService;

        // Preservación explícita del contexto 'this' para Express
        this.askQuery = this.askQuery.bind(this);
        this.getQueryHistory = this.getQueryHistory.bind(this);
        this.getAdminMetrics = this.getAdminMetrics.bind(this);
    }

    /**
     * Recibe la pregunta del estudiante y solicita la respuesta al puente de n8n.
     * Ruta: POST /api/v1/queries/ask
     * Permisos: Estudiante / Administrador
     */
    async askQuery(req, res, next) {
        try {
            const studentId = req.user.id;
            const userRole = req.user.role;
            const queryDto = req.body;

            const result = await this.queryService.executeStudentQuery(studentId, userRole, queryDto);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene la lista de conversaciones pasadas del estudiante con el bot.
     * Ruta: GET /api/v1/queries/history
     * Permisos: Estudiante / Administrador
     */
    async getQueryHistory(req, res, next) {
        try {
            const studentId = req.user.id;
            const { limit = 20, page = 1 } = req.query;

            const history = await this.queryService.getStudentHistory(studentId, Number(limit), Number(page));

            return res.status(200).json({
                success: true,
                data: history
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Devuelve estadísticas de uso de la IA para el panel de control del administrador.
     * Ruta: GET /api/v1/queries/metrics
     * Permisos: Exclusivo Administrador
     */
    async getAdminMetrics(req, res, next) {
        try {
            const metrics = await this.queryService.getAdminMetrics();

            return res.status(200).json({
                success: true,
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }
}