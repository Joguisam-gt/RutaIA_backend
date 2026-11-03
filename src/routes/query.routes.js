// src/routes/query.routes.js
import { Router } from 'express';
import QueryController from '../controllers/query.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const queryController = new QueryController();

// Middleware de autenticación opcional o pasante si no se requiere sesión estricta
const authGuard = AuthMiddleware?.authenticate || ((req, res, next) => next());

// Ruta para enviar preguntas a la IA (vía Proxy Express -> n8n -> Qdrant)
router.post('/ask', authGuard, (req, res, next) => queryController.ask(req, res, next));

// Ruta para calificar respuestas de IA
router.post('/rate', authGuard, (req, res, next) => queryController.rate(req, res, next));

export default router;