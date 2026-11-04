// src/routes/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import queryRoutes from './query.routes.js';
import studentRoutes from './student.routes.js';
import courseRoutes from './course.routes.js';
import ratingRoutes from './rating.routes.js';
import metricRoutes from './metric.routes.js';
import instructorRoutes from './instructor.routes.js';
import notificationRoutes from './notification.routes.js';

class AppRouter {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Rutas bajo convención REST en plural
        this.router.use('/auth', authRoutes);
        this.router.use('/queries', queryRoutes);
        this.router.use('/students', studentRoutes); // Corregido a plural
        this.router.use('/courses', courseRoutes);
        this.router.use('/ratings', ratingRoutes);   // RF 17 garantizado
        this.router.use('/metrics', metricRoutes);   // RF 18 garantizado

        // Módulos complementarios si existen en tu base de código
        if (instructorRoutes) this.router.use('/instructors', instructorRoutes);
        if (notificationRoutes) this.router.use('/notifications', notificationRoutes);
    }
}

export default new AppRouter().router;