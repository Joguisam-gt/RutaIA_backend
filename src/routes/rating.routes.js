// src/routes/rating.routes.js
import { Router } from 'express';
import ratingController from '../controllers/rating.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

class RatingRoutes {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        /**
         * @route   POST /api/v1/ratings
         * @desc    Califica una recomendación de la IA (RF 17)
         * @access  Privado (Requiere autenticación de estudiante)
         */
        this.router.post(
            '/', 
            AuthMiddleware.authenticate, 
            ratingController.rate
        );
    }
}

export default new RatingRoutes().router;