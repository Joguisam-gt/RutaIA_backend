import express from 'express';
import cors from 'cors';
import { CORS_ORIGIN } from './config/environment.js';
import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware.js';

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