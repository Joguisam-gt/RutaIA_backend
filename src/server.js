// src/server.js
import http from 'node:http';
import app from './app.js';
import Database from './config/database.js';
import { PORT } from './config/environment.js';
import logger from './utils/logger.js';

/**
 * Clase orientada a objetos para el arranque y control del ciclo de vida del servidor (SRP & Robustez).
 * Inicia la conexión a MongoDB, levanta el servidor HTTP Express y gestiona el apagado gradual.
 */
export class Server {
    /**
     * Puerto de escucha para el servidor HTTP.
     * Instancia de Express.
     */
    constructor(port = PORT, appInstance = app) {
        this.port = port;
        this.app = appInstance;
        this.server = null;
    }

    /**
     * Conecta la base de datos y pone a escuchar el servidor HTTP en el puerto configurado.
     */
    async start() {
        try {
            // 1. Conexión estricta a MongoDB antes de aceptar tráfico HTTP
            await Database.connect();
            logger.info('Conexión a la base de datos MongoDB establecida.');

            // 2. Creación e inicio del servidor HTTP
            this.server = http.createServer(this.app);

            this.server.listen(this.port, () => {
                logger.info(`Servidor HTTP ejecutándose en el puerto ${this.port}`);
                logger.info(`Healthcheck listo en: http://localhost:${this.port}/health`);
            });

            // 3. Configuración de cierre controlado de conexiones
            this._setupGracefulShutdown();

        } catch (error) {
            logger.error('Fallo crítico al inicializar el servidor:', error.message);
            process.exit(1);
        }
    }

    /**
     * Registra los escuchadores de eventos del sistema para un apagado limpio (Graceful Shutdown).
     */
    _setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger.warn(`Señal ${signal} recibida. Cerrando conexiones limpiamente...`);

            if (this.server) {
                this.server.close(async () => {
                    logger.info('Servidor HTTP detenido.');
                    await Database.disconnect();
                    logger.info('Conexión a MongoDB cerrada.');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        };

        // Eventos de interrupción de terminal y contenedores (SIGINT, SIGTERM)
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Captura de errores no controlados a nivel de proceso
        process.on('unhandledRejection', (reason) => {
            logger.error('Rechazo de promesa no controlado (unhandledRejection):', reason);
        });

        process.on('uncaughtException', (error) => {
            logger.error('Excepción no capturada (uncaughtException):', error.message);
            process.exit(1);
        });
    }
}

// Inicialización del servidor
const serverInstance = new Server();
serverInstance.start();