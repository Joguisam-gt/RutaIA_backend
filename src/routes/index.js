// src/routes/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import queryRoutes from './query.routes.js';
import studentRoutes from './student.routes.js';
import ratingRoutes from './rating.routes.js';
import metricRoutes from './metric.routes.js';

class AppRouter {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Enrutamiento modular bajo convencion REST en plural
        this.router.use('/auth', authRoutes);
        this.router.use('/courses', courseRoutes);
        this.router.use('/queries', queryRoutes);
        this.router.use('/students', studentRoutes);
        this.router.use('/ratings', ratingRoutes);
        this.router.use('/metrics', metricRoutes);
    }
}

export default new AppRouter().router;