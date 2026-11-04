// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import * as envModule from '../config/environment.js';
import { AppError } from '../errors/appError.js';

const JWT_SECRET = 
    envModule.JWT_SECRET || 
    envModule.environment?.jwtSecret || 
    process.env.JWT_SECRET || 
    'rutaia_secret_jwt_key_2026';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('No autorizado. Token no proporcionado.', 401));
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError('Token inválido o expirado.', 401));
    }
};

export const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch {
            // Permite el paso para usuarios anónimos
        }
    }
    next();
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('Acceso denegado. Permisos insuficientes.', 403));
        }
        next();
    };
};

export class AuthMiddleware {
    static authMiddleware = authMiddleware;
    static optionalAuthMiddleware = optionalAuthMiddleware;
    static authorize = authorize;
}

export default AuthMiddleware;