// Principio SRP (Single Responsibility Principle): Encapsula la definición específica de errores por recursos no encontrados (HTTP 404).
import AppError from './appError.js';

/**
 * Excepción personalizada para representar fallos por recursos inexistentes en la base de datos o sistema.
 */
export class NotFoundError extends AppError {
    /**
     * Crea un error HTTP 404.
     * @param {string} message - Mensaje descriptivo de la entidad o recurso no encontrado.
     */
    constructor(message = 'El recurso solicitado no fue encontrado.') {
        super(message, 404);
    }
}

// Exportación por defecto para soportar: import NotFoundError from '../errors/notFoundError.js';
export default NotFoundError;