// src/server.js
import Database from './config/database.js';
import DatabaseIndexer from './config/databaseIndexer.js';
import app from './app.js';
import { PORT, N8N_CHAT_WEBHOOK_URL, environment } from './config/environment.js';
import logger from './utils/logger.js';

/**
 * Tiempo maximo de espera del servidor en milisegundos (6 minutos = 360,000 ms)
 */
const SIX_MINUTES_MS = 360000;

/**
 * Verifica la disponibilidad y conectividad del servicio de automatizacion n8n
 * @returns {Promise<boolean>} Devuelve true si el webhook de n8n responde correctamente.
 */
async function checkN8nConnection() {
    const webhookUrl = N8N_CHAT_WEBHOOK_URL || environment.n8n.chatWebhookUrl;

    if (!webhookUrl) {
        logger.warn('[n8n status]: Advertencia - No se ha configurado la URL de Webhook de n8n en el archivo .env');
        return false;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(webhookUrl, {
            method: 'GET',
            signal: controller.signal
        }).catch(() => null);

        clearTimeout(timeoutId);

        logger.info(`[n8n status]: Conexion alcanzable con n8n en: ${webhookUrl}`);
        return true;
    } catch (error) {
        logger.warn(`[n8n status]: n8n configurado en ${webhookUrl}, pero el webhook no respondio en el arranque (Offline/Standby).`);
        return false;
    }
}

/**
 * Funcion principal que orquesta el arranque del servidor y sus servicios dependientes.
 */
async function startServer() {
    try {
        logger.info('Iniciando servicios e infraestructura de RutaIA Backend...');

        // 1. Conexion a MongoDB
        await Database.connect();
        logger.info('[MongoDB status]: Conexion establecida correctamente con la base de datos.');

        // 2. Aplicacion de esquemas JSON Schema de validacion
        await Database.applyJsonSchemas();

        // 3. Creacion y sincronizacion de indices NoSQL
        await DatabaseIndexer.applyIndexes();
        logger.info('[MongoDB status]: Esquemas JSON Schema e indices NoSQL sincronizados al 100%.');

        // 4. Verificacion de conectividad con n8n Webhooks
        await checkN8nConnection();

        // 5. Inicializacion del servidor Express
        const serverPort = PORT || 3000;
        const server = app.listen(serverPort, () => {
            logger.info(`Servidor ejecutandose exitosamente en el puerto: ${serverPort}`);
            logger.info(`URL Base de la API: http://localhost:${serverPort}/api/v1`);
            logger.info(`Documentacion Swagger UI: http://localhost:${serverPort}/api-docs`);
            logger.info(`Timeout de socket configurado a: 6 minutos (${SIX_MINUTES_MS} ms)`);
        });

        // 6. Configuracion explicita de timeouts HTTP
        server.timeout = SIX_MINUTES_MS;
        server.requestTimeout = SIX_MINUTES_MS;
        server.headersTimeout = SIX_MINUTES_MS + 5000;
        server.keepAliveTimeout = SIX_MINUTES_MS;

    } catch (error) {
        logger.error('Falla critica al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

// Ejecuta el arranque del servidor
startServer();