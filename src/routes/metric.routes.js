// src/routes/metric.routes.js
import { Router } from 'express';
import metricController from '../controllers/metric.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

class MetricRoutes {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        /**
         * @route   GET /api/v1/metrics
         * @desc    Obtiene las estadísticas básicas de la plataforma (RF 18)
         * @access  Público / Swagger
         */
        this.router.get('/', metricController.getPlatformMetrics);

        /**
         * @route   GET /api/v1/metrics/student
         * @desc    Métricas personales del estudiante autenticado
         * @access  Privado (Estudiantes)
         */
        this.router.get(
            '/student', 
            AuthMiddleware.authenticate, 
            metricController.getStudentMetrics
        );
    }
}

export default new MetricRoutes().router;