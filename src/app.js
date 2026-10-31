// src/app.js
import express from 'express';
import cors from 'cors';
import { CORS_ORIGIN } from './config/environment.js';
import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware.js';
import notificationRoutes from './routes/notification.routes.js';
// Importación de enrutadores
import studentRoutes from './routes/student.routes.js';
import courseRoutes from './routes/course.routes.js';
import queryRoutes from './routes/query.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import metricRoutes from './routes/metric.routes.js';

/**
 * Clase orientada a objetos para la inicialización y configuración de Express (SRP & Encapsulamiento).
 * Modula la inyección de middlewares globales, montaje de rutas y gestión centralizada de errores.
 */
export class App {
    constructor() {
        this.app = express();
        this._configureMiddlewares();
        this._mountRoutes();
        this._configureErrorHandling();
    }

    /**
     * Registra los middlewares globales para el procesamiento de peticiones.
     */
    _configureMiddlewares() {
        // Configuración de CORS restringida al origen autorizado
        this.app.use(
            cors({
                origin: CORS_ORIGIN,
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization']
            })
        );

        // Parsing automático de cuerpos de petición JSON y URL-encoded
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    }

    /**
     * Monta los módulos de rutas del sistema bajo el prefijo común /api/v1.
     */
    _mountRoutes() {
        // Healthcheck endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'UP',
                service: 'RutaIA Backend Bridge',
                timestamp: new Date().toISOString()
            });
        });

        // Rutas de dominio
        this.app.use('/api/v1/students', studentRoutes);
        this.app.use('/api/v1/courses', courseRoutes);
        this.app.use('/api/v1/queries', queryRoutes);
        this.app.use('/api/v1/ratings', ratingRoutes);
        this.app.use('/api/v1/metrics', metricRoutes);
        this.app.use('/api/v1/notifications', notificationRoutes);

        // Manejo de rutas inexistentes (404 Not Found)
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                status: 'fail',
                message: `La ruta '${req.originalUrl}' no existe en este servidor.`
            });
        });
    }

    /**
     * Conecta el middleware de captura de errores al final de la cadena de Express.
     */
    _configureErrorHandling() {
        this.app.use(ErrorHandlerMiddleware);
    }

    /**
     * Devuelve la instancia configurada de la aplicación Express.
     */
    getExpressInstance() {
        return this.app;
    }
}

// Exportación de la instancia instanciada de Express
const appInstance = new App();
export default appInstance.getExpressInstance();
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

// Definición de Rutas API v1
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/queries', queryRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/metrics', metricRoutes);

// Interceptor para rutas no encontradas (404)
app.use((req, res, next) => {
    next(new AppError(`La ruta solicitada '${req.originalUrl}' no existe en este servidor.`, 404));
});

// Middleware centralizado de errores (Debe ir obligatoriamente al final)
app.use(ErrorHandlerMiddleware.handle);

export default app;
