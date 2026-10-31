// src/app.js
import express from 'express';
import cors from 'cors';

// Rutas API v1
import studentRoutes from './routes/student.routes.js';
import courseRoutes from './routes/course.routes.js';
import queryRoutes from './routes/query.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import metricRoutes from './routes/metric.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// Middlewares y Errores
import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware.js';
import AppError from './errors/appError.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de salud del servidor
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'RutaIA Backend Bridge'
    });
});

// Enrutamiento API v1
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/queries', queryRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/metrics', metricRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Interceptor para rutas no encontradas (404)
app.use((req, res, next) => {
    next(new AppError(`La ruta solicitada '${req.originalUrl}' no existe en este servidor.`, 404));
});

// Middleware centralizado de errores (Debe ir estrictamente al final)
app.use(ErrorHandlerMiddleware.handle);

export default app;