// src/routes/auth.routes.js
import { Router } from 'express';
import AuthControllerImport from '../controllers/auth.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

// Resolucion segura: si es clase la instancia, si ya es objeto lo usa directo
const authController = typeof AuthControllerImport === 'function'
    ? new AuthControllerImport()
    : AuthControllerImport;

class AuthRoutes {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        /**
         * @route   POST /api/v1/auth/login
         * @desc    Inicia sesion y genera token JWT
         */
        this.router.post('/login', authController.login);

        /**
         * @route   POST /api/v1/auth/register
         * @desc    Registra un nuevo estudiante (RF 01)
         */
        this.router.post('/register', authController.register);

        /**
         * @route   GET /api/v1/auth/me
         * @desc    Obtiene el perfil del estudiante autenticado
         * @access  Privado (Requiere JWT)
         */
        this.router.get('/me', AuthMiddleware.authenticate, authController.getMe);

        /**
         * @route   POST /api/v1/auth/logout
         * @desc    Cierra la sesion activa
         */
        this.router.post('/logout', authController.logout);
    }
}

export default new AuthRoutes().router;