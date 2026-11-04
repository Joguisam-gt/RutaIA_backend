// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import * as envModule from '../config/environment.js';

const JWT_SECRET = 
    envModule.JWT_SECRET || 
    envModule.environment?.jwtSecret || 
    process.env.JWT_SECRET || 
    'rutaia_secret_jwt_key_2026';

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado. Token no proporcionado.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado.',
            error: error.message
        });
    }
};

export const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
    } catch {
        // Permite el paso para usuarios anónimos si el token es inválido o no existe
    }
    next();
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Permisos insuficientes.'
            });
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