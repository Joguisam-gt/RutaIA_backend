// src/routes/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import queryRoutes from './query.routes.js';
import studentRoutes from './student.routes.js';
import courseRoutes from './course.routes.js';
import metricRoutes from './metric.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/queries', queryRoutes);
router.use('/student', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/metrics', metricRoutes);


export default router;