// src/routes/query.routes.js
import { Router } from 'express';
import QueryController from '../controllers/query.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const queryController = new QueryController();

/**
 * @route   POST /api/v1/queries/ask
 * @desc    Procesa preguntas hacia el agente RAG en n8n y Qdrant.
 * @access  Público / Anónimo (ChatBubble) y Autenticado (Estudiantes)
 */
router.post('/ask', optionalAuthMiddleware, queryController.ask);

/**
 * @route   GET /api/v1/queries/history
 * @desc    Obtiene el historial de consultas del usuario autenticado guardado en MongoDB.
 * @access  Privado (Requiere Token JWT)
 */
router.get('/history', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const history = await queryController.queryService.getUserQueryHistory(userId);
        return res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/v1/queries/rate
 * @desc    Registra la calificación otorgada por un estudiante a la respuesta de la IA.
 * @access  Público u Opcionalmente Autenticado
 */
router.post('/rate', optionalAuthMiddleware, queryController.rate);

export default router;