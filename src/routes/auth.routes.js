import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Autentica usuarios y devuelve JWT
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registra un estudiante en el sistema
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cierra la sesión del usuario
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtiene los datos del usuario autenticado
 */
router.get('/me', authMiddleware, authController.getMe);

export default router;