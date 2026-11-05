import jwt from 'jsonwebtoken';
import { environment } from '../config/environment.js';
import AppErrorImport from '../errors/appError.js';

// Compatibilidad de importación resiliente para AppError (soporta export default y export named)
const AppError = AppErrorImport?.AppError || AppErrorImport || Error;

// Resolución segura del secreto JWT ante cualquier variación en config/environment o .env
const getJwtSecret = () => {
    const secret = environment?.jwtSecret || environment?.jwt?.secret || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Configuración crítica faltante: El secreto JWT (JWT_SECRET) no está definido.');
    }
    return secret;
};

// Extractor reutilizable de token Bearer
const extractBearerToken = (authHeader) => {
    if (!authHeader || typeof authHeader !== 'string') return null;

    const match = authHeader.match(/^Bearer\s+(\S+)$/i);
    if (!match) return null;

    const token = match[1].trim();

    // Filtra valores inválidos comúnmente enviados por Axios/LocalStorage del frontend
    if (token === 'null' || token === 'undefined' || token === '') {
        return null;
    }

    return token;
};

export class AuthMiddleware {
    /**
     * Autenticación Estricta:
     * Intercepta la petición y valida que el JWT sea legítimo y vigente.
     * Si no hay token o es inválido, rechaza con 401.
     */
    static authenticate = (req, res, next) => {
        try {
            const token = extractBearerToken(req.headers.authorization);

            if (!token) {
                return next(new AppError('No autorizado. Token no proporcionado o formato inválido.', 401));
            }

            const secret = getJwtSecret();
            const decoded = jwt.verify(token, secret);

            req.user = decoded;
            return next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return next(new AppError('La sesión ha expirado. Por favor, inicia sesión nuevamente.', 401));
            }
            if (error.name === 'JsonWebTokenError') {
                return next(new AppError('Token de autenticación inválido o corrupto.', 401));
            }
            return next(error);
        }
    };

    /**
     * Autenticación Opcional (Guest Friendly):
     * Si viene un token válido, decodifica y asigna req.user.
     * Si NO viene token, viene "Bearer null/undefined" o está expirado,
     * deja req.user = null y permite el paso SIN responder 401.
     */
    static optionalAuthenticate = (req, res, next) => {
        req.user = null; // Garantiza un estado predeterminado limpio

        const token = extractBearerToken(req.headers.authorization);

        if (!token) {
            return next();
        }

        try {
            const secret = getJwtSecret();
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
        } catch {
            // El token es inválido, falso o expiró: se degrada a invitado (guest)
            req.user = null;
        }

        return next();
    };

    /**
     * Control de Acceso Basado en Roles (RBAC):
     * @param  {...string} roles - Roles permitidos ('student', 'admin', etc.)
     */
    static authorize = (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return next(new AppError('No autorizado. Se requiere iniciar sesión.', 401));
            }

            const userRole = String(req.user.role || '').toLowerCase();
            const allowedRoles = roles.map(r => String(r).toLowerCase());

            if (!allowedRoles.includes(userRole)) {
                return next(new AppError('Acceso denegado. Permisos insuficientes.', 403));
            }

            return next();
        };
    };
}

// Exportaciones de conveniencia para retrocompatibilidad
export const authMiddleware = AuthMiddleware.authenticate;
export const optionalAuthMiddleware = AuthMiddleware.optionalAuthenticate;
export const authorize = AuthMiddleware.authorize;

export default AuthMiddleware;