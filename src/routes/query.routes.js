// src/routes/query.routes.js
import { Router } from 'express';
import queryController from '../controllers/query.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

class QueryRoutes {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        /**
         * @route   POST /api/v1/queries/ask (o POST /api/v1/queries)
         * @desc    Procesa una pregunta en lenguaje natural hacia el flujo RAG (RF 06, RF 08)
         * @access  Privado (Estudiantes) / Con tolerancia a ChatBubble si optionalAuthMiddleware está activo
         */
        this.router.post(
            '/ask', 
            AuthMiddleware.optionalAuthenticate, 
            queryController.ask
        );

        // Alias directo para REST estándar: POST /api/v1/queries
        this.router.post(
            '/', 
            AuthMiddleware.optionalAuthenticate, 
            queryController.ask
        );

        /**
         * @route   GET /api/v1/queries/history
         * @desc    Obtiene el historial de consultas del estudiante autenticado (RF 16)
         * @access  Privado (Requiere Token JWT)
         */
        this.router.get(
            '/history', 
            AuthMiddleware.authenticate, 
            queryController.getHistory
        );
    }
}

export default new QueryRoutes().router;