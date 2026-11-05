// src/server.js
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { environment } from './config/environment.js';
import logger from './utils/logger.js';

const app = express();

// ✅ MIDDLEWARE DE CORS NATIVO E INFALIBLE
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Permite cualquier origen local (5173, 3000, 127.0.0.1, etc.)
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Shared-Secret');

    // Si es la petición previa del navegador (OPTIONS), responde de inmediato con 204
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Parsers JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de la API
app.use('/api/v1', routes);

// Middleware global de errores
app.use((err, req, res, next) => {
    logger.error('Error capturado en Express:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

const PORT = environment?.port || process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info(`Servidor RutaIA activo y escuchando en http://localhost:${PORT}`);
});

server.setTimeout(390000);
server.keepAliveTimeout = 390000;
server.headersTimeout = 395000;

export default app;