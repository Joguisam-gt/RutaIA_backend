import authService from '../services/auth.service.js';
import logger from '../utils/logger.js';

export class AuthController {
    /**
     * Inicia sesión de estudiante/admin
     */
    login = async (req, res, next) => {
        try {
            const { email, username, password } = req.body;
            const targetEmail = email || username;

            const result = await authService.login({ email: targetEmail, password });

            return res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso.',
                data: result
            });
        } catch (error) {
            logger.error('[Auth Error en /login]:', error);
            next(error);
        }
    };

    /**
     * Registra un nuevo estudiante
     */
    register = async (req, res, next) => {
        try {
            const result = await authService.register(req.body);

            return res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente.',
                data: result
            });
        } catch (error) {
            logger.error('[Auth Error en /register]:', error);
            next(error);
        }
    };

    /**
     * Obtiene la información del perfil autenticado
     */
    getMe = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?._id;
            const user = await authService.getMe(userId);

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('[Auth Error en /me]:', error);
            next(error);
        }
    };

    /**
     * Cierra la sesión activa
     */
    logout = async (req, res, next) => {
        try {
            return res.status(200).json({
                success: true,
                message: 'Sesión cerrada correctamente.'
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new AuthController();