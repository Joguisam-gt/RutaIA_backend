// src/routes/metric.routes.js
import { Router } from 'express';
import MetricController from '../controllers/metric.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const metricController = new MetricController();

router.get('/student', authMiddleware, metricController.getStudentMetrics);

export default router;