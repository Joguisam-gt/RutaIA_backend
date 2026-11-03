// Principio SRP: Define los endpoints de autenticación y verificación de estado.
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Ruta de comprobación de estado/perfil de usuario autenticado
router.get('/me', authMiddleware, authController.getMe);

export default router;