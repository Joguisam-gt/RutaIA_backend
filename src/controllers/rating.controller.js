// src/controllers/rating.controller.js
import RatingService from '../services/rating.service.js';

/**
 * Controlador orientado a objetos para la gestión de calificaciones y reseñas de cursos (SRP & DIP).
 * Procesa las valoraciones que los estudiantes asignan a los cursos recomendados por la IA.
 */
export default class RatingController {
    /**
     * Inyección de dependencias en el constructor.
     */
    constructor(ratingService = new RatingService()) {
        this.ratingService = ratingService;

        // Preservación explícita del contexto 'this' para Express
        this.createOrUpdateRating = this.createOrUpdateRating.bind(this);
        this.getCourseRatings = this.getCourseRatings.bind(this);
        this.getCourseRatingStats = this.getCourseRatingStats.bind(this);
    }

    /**
     * Recibe y registra (o actualiza) la calificación de un estudiante para un curso recomendado.
     * Ruta: POST /api/v1/ratings
     * Permisos: Estudiante / Administrador
     */
    async createOrUpdateRating(req, res, next) {
        try {
            const studentId = req.user.id;
            const ratingDto = req.body;

            const result = await this.ratingService.rateCourse(studentId, ratingDto);

            return res.status(200).json({
                success: true,
                message: 'Calificación procesada exitosamente.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene la lista paginada de calificaciones y comentarios de un curso.
     * Ruta: GET /api/v1/ratings/course/:courseId
     */
    async getCourseRatings(req, res, next) {
        try {
            const { courseId } = req.params;
            const { limit = 10, page = 1 } = req.query;

            const ratings = await this.ratingService.getRatingsByCourse(
                courseId,
                Number(limit),
                Number(page)
            );

            return res.status(200).json({
                success: true,
                data: ratings
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene las métricas consolidadas (promedio de estrellas y total de votos) de un curso.
     * Ruta: GET /api/v1/ratings/course/:courseId/stats
     */
    async getCourseRatingStats(req, res, next) {
        try {
            const { courseId } = req.params;
            const stats = await this.ratingService.getCourseStats(courseId);

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}