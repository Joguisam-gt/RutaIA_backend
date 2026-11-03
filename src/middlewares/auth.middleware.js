// src/middlewares/auth.middleware.js
// Principio SRP (Single Responsibility Principle): Encapsula la verificación de autenticación basada en tokens JWT para proteger las rutas privadas de la API.
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/environment.js';
import { AppError } from '../errors/appError.js';

/**
 * Middleware para validar la presencia y firma del Token JWT en las peticiones entrantes.
 * @param {import('express').Request} req - Objeto de petición Express.
 * @param {import('express').Response} res - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función de paso al siguiente middleware/controlador.
 */
export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No se proporcionó un token de autenticación válido.', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verificación de la firma del token con el secreto del sistema
        const decoded = jwt.verify(token, JWT_SECRET);

        // Asigna el usuario decodificado a la petición para ser consumido por controladores subsiguientes
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new AppError('Token inválido o expirado. Por favor, inicia sesión nuevamente.', 401));
        }
        next(error);
    }
};

// Exportación por defecto para mantener compatibilidad con sintaxis: import authMiddleware from '../middlewares/auth.middleware.js';
export default authMiddleware;