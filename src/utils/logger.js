// src/utils/logger.js
// Principio SRP (Single Responsibility Principle): Encapsula el formateo e impresión de logs del sistema sin requerir paquetes externos.

/**
 * Función auxiliar para formatear la marca de tiempo ISO actual.
 * @returns {string} Timestamp en formato ISO.
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Instancia del registrador de eventos basado en funciones nativas de consola.
 */
const loggerInstance = {
    /**
     * Imprime mensajes informativos generalizados.
     * @param {...any} args - Mensajes o metadatos a registrar.
     */
    info: (...args) => {
        console.log(`[${getTimestamp()}] [INFO]:`, ...args);
    },

    /**
     * Imprime advertencias de ejecución o contingencias controladas.
     * @param {...any} args - Mensajes o metadatos de advertencia.
     */
    warn: (...args) => {
        console.warn(`[${getTimestamp()}] [WARN]:`, ...args);
    },

    /**
     * Imprime errores y excepciones capturadas por el sistema.
     * @param {...any} args - Errores u objetos de excepción.
     */
    error: (...args) => {
        console.error(`[${getTimestamp()}] [ERROR]:`, ...args);
    },

    /**
     * Imprime trazabilidad de depuración en entornos de desarrollo.
     * @param {...any} args - Información detallada de depuración.
     */
    debug: (...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[${getTimestamp()}] [DEBUG]:`, ...args);
        }
    }
};

// Exportación nombrada para soportar: import { logger } from '../utils/logger.js';
export const logger = loggerInstance;

// Exportación por defecto para soportar: import logger from '../utils/logger.js';
export default loggerInstance;