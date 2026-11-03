// Principio SRP: Responsabilidad única de dar formato y emitir logs de la aplicación.
import winston from 'winston';

// Configuración de formatos y transporte para logs en consola y archivo
const loggerInstance = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Exportación nombrada para soportar: import { logger } from '../utils/logger.js';
export const logger = loggerInstance;

// Exportación por defecto para soportar: import logger from '../utils/logger.js';
export default loggerInstance;