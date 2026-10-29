/**
 * Clase base para todas las excepciones operacionales controladas del sistema (SRP & OCP).
 * Hereda de la clase nativa Error de JavaScript.
 */
class AppError extends Error {
    /**
     * @param {string} message - Descripción legible del error.
     * @param {number} statusCode - Código de estado HTTP (4xx o 5xx).
     */
    constructor(message, statusCode = 500) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Identifica errores de negocio/infraestructura conocidos

        // Preserva la pila de llamadas excluyendo la llamada al constructor de esta clase
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;