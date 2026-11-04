// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment.js';
import { AppError } from '../errors/appError.js';

export class AuthMiddleware {
    /**
     * Intercepta la petición y valida que el JWT sea legítimo y vigente.
     * Inyecta el payload en req.user.
     */
    static authenticate = (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(new AppError('No autorizado. Token no proporcionado.', 401));
        }

        const match = authHeader.match(/^Bearer\s+(\S+)$/i);
        if (!match) {
            return next(new AppError('Formato de autorización inválido. Debe ser: Bearer <token>.', 401));
        }

        const token = match[1];

        try {
            const decoded = jwt.verify(token, environment.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return next(new AppError('La sesión ha expirado. Por favor, inicia sesión nuevamente.', 401));
            }
            return next(new AppError('Token de autenticación inválido.', 401));
        }
    };

    /**
     * Autenticación opcional: inyecta req.user si el token es válido,
     * pero no bloquea la petición si no se proporciona (útil para visitantes anónimos).
     */
    static optionalAuthenticate = (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const match = authHeader.match(/^Bearer\s+(\S+)$/i);
            if (match) {
                try {
                    const decoded = jwt.verify(match[1], environment.jwtSecret);
                    req.user = decoded;
                } catch {
                    // Token inválido o expirado; se continúa como anónimo de forma intencional
                }
            }
        }
        next();
    };

    /**
     * Middleware de autorización basado en Roles (RBAC).
     * @param  {...string} roles - Roles permitidos ('student', 'admin')
     */
    static authorize = (...roles) => {
        return (req, res, next) => {
            if (!req.user || !roles.includes(req.user.role)) {
                return next(new AppError('Acceso denegado. Permisos insuficientes.', 403));
            }
            next();
        };
    };
}

// Exportaciones nombradas de conveniencia para retrocompatibilidad
export const authMiddleware = AuthMiddleware.authenticate;
export const optionalAuthMiddleware = AuthMiddleware.optionalAuthenticate;
export const authorize = AuthMiddleware.authorize;

export default AuthMiddleware;