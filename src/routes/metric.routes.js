// src/routes/metric.routes.js
import { Router } from 'express';
import MetricController from '../controllers/metric.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const metricController = new MetricController();

// Todas las rutas de métricas son de uso exclusivo para el Administrador
router.use(AuthMiddleware.authenticate, AuthMiddleware.authorize('admin'));

// Resumen del Dashboard general
router.get('/dashboard', metricController.getSystemMetrics);

// Rendimiento de la IA (n8n y Qdrant)
router.get('/ai-recommendations', metricController.getAIRecommendationMetrics);

// Estadísticas agregadas del catálogo de cursos
router.get('/courses', metricController.getCourseMetrics);

export default router;