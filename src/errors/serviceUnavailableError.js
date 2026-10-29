const AppError = require('./appError');

/**
 * Excepción lanzada cuando n8n o un servicio externo no responde o agota el tiempo de espera (LSP & OCP).
 */
class ServiceUnavailableError extends AppError {
    /**
     * @param {string} message - Mensaje explicativo del fallo del servicio.
     */
    constructor(message = 'El motor de Inteligencia Artificial (n8n) no se encuentra disponible temporalmente.') {
        super(message, 503);
    }
}

module.exports = ServiceUnavailableError;