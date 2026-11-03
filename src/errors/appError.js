// Principio SRP (Single Responsibility Principle): Define la clase base para la jerarquía de errores operacionales del sistema.

/**
 * Clase base personalizada para gestionar errores operacionales y de negocio en la API Express.
 */
export class AppError extends Error {
    /**
     * Crea una instancia de error operacional.
     * @param {string} message - Descripción legible del error.
     * @param {number} statusCode - Código de respuesta HTTP (ej. 400, 404, 502, 500).
     */
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // Captura la traza de la pila excluyendo el constructor de esta clase
        Error.captureStackTrace(this, this.constructor);
    }
}

// Exportación por defecto para soportar: import AppError from '../errors/appError.js';
export default AppError;