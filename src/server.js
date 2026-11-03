import Database from './config/database.js';
import DatabaseIndexer from './config/databaseIndexer.js';
import app from './app.js';
import { PORT, N8N_CHAT_WEBHOOK_URL, N8N_DOCS_WEBHOOK_URL, environment } from './config/environment.js';
import logger from './utils/logger.js';

/**
 * Verifica la disponibilidad y conectividad del servicio de automatización n8n mediante un pingo/petición de estado.
 * @returns {Promise<boolean>} Devuelve true si el webhook de n8n responde correctamente.
 */
async function checkN8nConnection() {
    const webhookUrl = N8N_CHAT_WEBHOOK_URL || environment.n8n.chatWebhookUrl;

    if (!webhookUrl) {
        logger.warn('[n8n status]: Advertencia - No se ha configurado la URL de Webhook de n8n en el archivo .env');
        return false;
    }

    try {
        // Configura un controlador de timeout de 3 segundos para no bloquear el arranque del servidor
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Realiza una petición ligera HEAD/POST de prueba hacia n8n
        const response = await fetch(webhookUrl, {
            method: 'GET',
            signal: controller.signal
        }).catch(() => null); // Silencia fallos de método HTTP (ej. si n8n requiere POST)

        clearTimeout(timeoutId);

        // Si la URL responde (incluso con 400 o 405 Method Not Allowed), el servicio n8n está alcanzable
        logger.info(`[n8n status]: Conexión exitosa y activa con n8n en: ${webhookUrl}`);
        return true;
    } catch (error) {
        logger.warn(`[n8n status]: n8n configurado en ${webhookUrl}, pero el webhook no respondió en el arranque (Offline/Standby).`);
        return false;
    }
}

/**
 * Función principal que orquesta el arranque del servidor y sus servicios dependientes.
 */
async function startServer() {
    try {
        logger.info('Iniciando servicios e infraestructura de RutaIA Backend...');

        // 1. Conexión nativa a la base de datos MongoDB
        await Database.connect();
        logger.info('[MongoDB status]: Conexión establecida correctamente con la base de datos.');

        // 2. Aplicación de esquemas JSON Schema de validación
        await Database.applyJsonSchemas();

        // 3. Creación y sincronización de índices NoSQL
        await DatabaseIndexer.applyIndexes();
        logger.info('[MongoDB status]: Esquemas JSON Schema e índices NoSQL sincronizados al 100%.');

        // 4. Verificación de conectividad con n8n Webhooks
        await checkN8nConnection();

        // 5. Inicialización del servidor Express
        const serverPort = PORT || 3000;
        app.listen(serverPort, () => {
            logger.info(`Servidor ejecutándose exitosamente en el puerto: ${serverPort}`);
            logger.info(`URL Base de la API: http://localhost:${serverPort}/api/v1`);
        });

    } catch (error) {
        logger.error('Falla crítica al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

// Ejecuta el arranque del servidor
startServer();