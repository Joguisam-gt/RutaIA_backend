import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/environment.js';
import AppError from '../errors/appError.js';

/**
 * Middleware orientado a objetos para el control de autenticación y autorización por roles (SRP).
 */
export default class AuthMiddleware {
    /**
     * Verifica la validez del token JWT enviado en la cabecera Authorization.
     */
    static authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AppError('Acceso denegado. No se proporcionó un token de autenticación válido.', 401);
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            req.user = {
                id: decoded.id || decoded.sub,
                role: decoded.role || 'student',
                email: decoded.email
            };

            return next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return next(new AppError('El token de autenticación es inválido o ha expirado.', 401));
            }
            return next(error);
        }
    }

    /**
     * Restringe el acceso a la ruta únicamente a los roles especificados.
     * Roles permitidos ('admin', 'student').
     */
    static authorize(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return next(new AppError('No tienes permisos suficientes para realizar esta acción.', 403));
            }
            return next();
        };
    }
}