// src/app.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';

import router from './routes/index.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import logger from './utils/logger.js';

// Resolucion de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga robusta de la especificacion OpenAPI / Swagger
let swaggerDocument = null;
const possibleSwaggerPaths = [
    path.resolve(process.cwd(), 'swagger.json'),
    path.resolve(__dirname, '../swagger.json'),
    path.resolve(__dirname, './swagger.json')
];

for (const p of possibleSwaggerPaths) {
    if (fs.existsSync(p)) {
        try {
            swaggerDocument = JSON.parse(fs.readFileSync(p, 'utf8'));
            break;
        } catch (e) {
            logger.warn(`[Swagger]: Error parseando JSON en ${p}`);
        }
    }
}

const app = express();

// 1. CONFIGURACION NATIVA Y DEFINITIVA DE CORS Y PREFLIGHT (OPTIONS)
// Este middleware intercepta la peticion previa OPTIONS y responde 204 de inmediato,
// resolviendo el error de CORS Failed y Network Error en Firefox y Chrome.
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Responder de inmediato a la comprobacion de pre-vuelo del navegador
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// 2. PARSERS DE CUERPO Y RATE LIMITING
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Proteccion contra saturacion de peticiones
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: 'Demasiadas solicitudes desde esta direccion IP. Intente nuevamente en 15 minutos.'
    }
});
app.use(globalLimiter);

// 3. DOCUMENTACION INTERACTIVA SWAGGER UI
if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'RutaIA - Documentacion API REST',
        customCss: '.swagger-ui .topbar { display: none }'
    }));
} else {
    app.use('/api-docs', (req, res) => {
        return res.status(503).json({
            success: false,
            message: 'El archivo swagger.json no fue encontrado en la raiz del proyecto.'
        });
    });
}

// Endpoint de verificacion de salud del servidor
app.get('/health', (req, res) => {
    return res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

// 4. RUTAS PRINCIPALES DE LA API REST
app.use('/api/v1', router);

// 5. MANEJADOR DE RUTAS NO ENCONTRADAS (404)
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        statusCode: 404,
        message: `La ruta solicitada '${req.method} ${req.originalUrl}' no existe en este servidor.`
    });
});

// 6. MANEJADOR GLOBAL DE ERRORES
app.use(errorHandler);

export default app;