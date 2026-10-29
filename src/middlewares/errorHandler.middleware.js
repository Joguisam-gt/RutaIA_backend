import logger from '../utils/logger.js';
import { NODE_ENV } from '../config/environment.js';

export default class ErrorHandlerMiddleware {
    static _sendResponse(err, res) {
        const isDevelopment = NODE_ENV === 'development';

        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message,
                ...(isDevelopment && { stack: err.stack })
            });
        }

        logger.error(' [ERROR CRÍTICO NO CONTROLADO]:', err);

        return res.status(500).json({
            success: false,
            status: 'error',
            message: isDevelopment ? err.message : 'Ha ocurrido un error interno en el servidor.',
            ...(isDevelopment && { stack: err.stack })
        });
    }

    static handle(err, req, res, next) {
        err.statusCode = err.statusCode || 500;
        err.status = err.status || 'error';

        logger.error(`[HTTP ${err.statusCode}] - ${err.message} - Method: ${req.method} - Path: ${req.originalUrl}`);

        ErrorHandlerMiddleware._sendResponse(err, res);
    }
}