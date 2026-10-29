const AppError = require('../errors/appError');
const logger = require('../utils/logger');
const { NODE_ENV } = require('../config/environment');

/**
 * Middleware orientado a objetos para el procesamiento centralizado de excepciones (SRP).
 */
class ErrorHandlerMiddleware {
    /**
     * Formatea la respuesta enviada al cliente según el entorno (desarrollo vs producción)
     */
    static _sendResponse(err, res) {
        const isDevelopment = NODE_ENV === 'development';

        // Si es un error operacional conocido, enviamos su código y mensaje
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message,
                ...(isDevelopment && { stack: err.stack })
            });
        }

        // Errores no controlados o de programación (no operacionales)
        logger.error(' [ERROR CRÍTICO NO CONTROLADO]:', err);

        return res.status(500).json({
            success: false,
            status: 'error',
            message: isDevelopment ? err.message : 'Ha ocurrido un error interno en el servidor.',
            ...(isDevelopment && { stack: err.stack })
        });
    }

    /**
     * Firma del middleware de errores de Express (4 parámetros requeridos por Express).
  /** */
    static handle(err, req, res, next) {
        err.statusCode = err.statusCode || 500;
        err.status = err.status || 'error';

        // Registro estructurado en el logger del sistema
        logger.error(`[HTTP ${err.statusCode}] - ${err.message} - Method: ${req.method} - Path: ${req.originalUrl}`);

        ErrorHandlerMiddleware._sendResponse(err, res);
    }
}

// Exportamos el método estático garantizando la firma de middleware de Express
module.exports = ErrorHandlerMiddleware.handle;