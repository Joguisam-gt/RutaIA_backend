import AppError from './appError.js';

/**
 * Excepción personalizada para errores de solicitud incorrecta (400 Bad Request).
 */
export default class BadRequestError extends AppError {
    /**
     * @param {string} message - Mensaje descriptivo de la falla de validación.
     */
    constructor(message = 'Solicitud incorrecta o datos de entrada inválidos.') {
        super(message, 400);
    }
}