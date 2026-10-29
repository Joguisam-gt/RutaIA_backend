/**
 * Clase orientada a objetos para el registro centralizado de eventos y errores en consola (SRP & OCP).
 * Aplica marcas de tiempo precisas y formato estandarizado según el nivel de severidad.
 */
export class Logger {
    /**
     * Genera una marca de tiempo en formato ISO estándar.
     * Marca de tiempo (ej. "2026-10-29T17:14:00.000Z").
     */
    static _getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Aplica formato estructurado a la salida de log.
     *  Nivel de severidad (INFO, WARN, ERROR, DEBUG).
     *  Mensaje descriptivo.
     *  Datos adicionales o stack trace.
     *  Cadena formateada para la consola.
     */
    static _formatMessage(level, message, meta) {
        const timestamp = Logger._getTimestamp();
        const formattedMeta = meta ? ` | Meta: ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
        return `[${timestamp}] [${level}]: ${message}${formattedMeta}`;
    }

    /**
     * Registra eventos informativos del ciclo de vida de la aplicación.
     * Mensaje informativo.
     * Metadatos opcionales.
     */
    static info(message, meta) {
        console.log(Logger._formatMessage('INFO', message, meta));
    }

    /**
     * Registra advertencias u observaciones no críticas del sistema.
     * Mensaje de advertencia.
     * Metadatos opcionales.
     */
    static warn(message, meta) {
        console.warn(Logger._formatMessage('WARN', message, meta));
    }

    /**
     * Registra errores críticos o excepciones de la aplicación.
     * Mensaje de error.
     * Objeto de error o stack trace.
     */
    static error(message, meta) {
        console.error(Logger._formatMessage('ERROR', message, meta));
    }

    /**
     * Registra mensajes de depuración en entornos de desarrollo.
     * Mensaje de depuración.
     * Metadatos opcionales.
     */
    static debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(Logger._formatMessage('DEBUG', message, meta));
        }
    }
}

// Exportación por defecto de la clase estática de logger
export default Logger;