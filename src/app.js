// src/app.js
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';

import router from './routes/index.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import logger from './utils/logger.js';

// Carga compatible de JSON en modulos ES
const require = createRequire(import.meta.url);
let swaggerDocument = null;
try {
    swaggerDocument = require('../swagger.json');
} catch (error) {
    logger.warn('[Swagger]: No se encontro swagger.json en la raiz del proyecto.');
}

const app = express();


// 1. CONFIGURACION DE SEGURIDAD Y CORS

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // Permite solicitudes sin origen (como Postman o Swagger) o en la lista permitida
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Permisivo en desarrollo local para evitar bloqueos del frontend
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// 2. PARSERS Y RATE LIMITING (Requerimiento Tecnico)

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Proteccion contra ataques de fuerza bruta y saturacion de peticiones
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // Limite de 300 peticiones por ventana por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: 'Demasiadas solicitudes desde esta direccion IP. Intente nuevamente en 15 minutos.'
    }
});
app.use(globalLimiter);


// 3. DOCUMENTACION SWAGGER UI
if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'RutaIA - Documentacion API REST',
        customCss: '.swagger-ui .topbar { display: none }' // Oculta barra superior generica
    }));
}

// Ruta basica de verificacion de estado
app.get('/health', (req, res) => {
    return res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

// 4. RUTAS PRINCIPALES DE LA API
app.use('/api/v1', router);

// 5. MANEJO DE RUTAS NO ENCONTRADAS (404)
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        statusCode: 404,
        message: `La ruta solicitada '${req.method} ${req.originalUrl}' no existe en este servidor.`
    });
});


// 6. MANEJADOR GLOBAL DE ERRORES (Requerimiento Tecnico)

app.use(errorHandler);

export default app;