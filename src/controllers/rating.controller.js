// src/controllers/rating.controller.js
import RatingService from '../services/rating.service.js';

export class RatingController {
    constructor(ratingService = new RatingService()) {
        this.ratingService = ratingService;
    }

    /**
     * Califica la recomendación generada por la IA (RF 17)
     * POST /api/v1/ratings
     * Body: { recommendationId, score, comment }
     */
    rate = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.body.studentId;
            const { recommendationId, score, comment, courseId } = req.body;

            // Si envían recommendationId, procesa RF 17 (Recomendación IA)
            if (recommendationId) {
                const result = await this.ratingService.rateRecommendation(studentId, {
                    recommendationId,
                    score,
                    comment
                });

                return res.status(201).json({
                    success: true,
                    message: 'Recomendación calificada exitosamente.',
                    data: result
                });
            }

            // Si envían courseId, procesa la calificación de curso con transacción
            const result = await this.ratingService.addRatingWithTransaction({
                studentId,
                courseId,
                ...req.body
            });

            return res.status(201).json({
                success: true,
                message: 'Calificación de curso procesada exitosamente.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    createOrUpdateRating = async (req, res, next) => this.rate(req, res, next);
}

export default new RatingController();