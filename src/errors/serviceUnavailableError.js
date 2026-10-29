import AppError from './appError.js';

export default class ServiceUnavailableError extends AppError {
    constructor(message = 'El motor de Inteligencia Artificial (n8n) no se encuentra disponible temporalmente.') {
        super(message, 503);
    }
}