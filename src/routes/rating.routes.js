// src/routes/rating.routes.js
import { Router } from 'express';
import RatingController from '../controllers/rating.controller.js';
import ValidatorMiddleware from '../middlewares/validator.middleware.js';
import CreateRatingDTO from '../dtos/rating/createRating.dto.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const ratingController = new RatingController();

// Registrar o actualizar calificación de un curso
router.post(
    '/',
    AuthMiddleware.authenticate,
    ValidatorMiddleware.validate(CreateRatingDTO),
    ratingController.createOrUpdateRating
);

// Obtener lista de reseñas de un curso
router.get('/course/:courseId', ratingController.getCourseRatings);

// Obtener estadísticas consolidadas de un curso
router.get('/course/:courseId/stats', ratingController.getCourseRatingStats);

export default router;