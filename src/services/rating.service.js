// src/services/rating.service.js
import Database from '../config/database.js';
import ratingRepositoryInstance from '../repositories/rating.repository.js';
import recommendationRepositoryInstance from '../repositories/recommendation.repository.js';
import courseRepositoryInstance from '../repositories/course.repository.js';
import BadRequestErrorImport from '../errors/badRequestError.js';
import NotFoundErrorImport from '../errors/notFoundError.js';
import logger from '../utils/logger.js';

const BadRequestError = BadRequestErrorImport?.BadRequestError || BadRequestErrorImport;
const NotFoundError = NotFoundErrorImport?.NotFoundError || NotFoundErrorImport;

export default class RatingService {
    constructor(
        ratingRepository = ratingRepositoryInstance,
        recommendationRepository = recommendationRepositoryInstance,
        courseRepository = courseRepositoryInstance
    ) {
        this.ratingRepository = ratingRepository;
        this.recommendationRepository = recommendationRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Califica la respuesta/recomendación generada por la IA (RF 17 estricto)
     * @param {string} studentId - ID del estudiante autenticado
     * @param {Object} data - { recommendationId, score, comment }
     */
    async rateRecommendation(studentId, { recommendationId, score, comment }) {
        if (!recommendationId) {
            throw new BadRequestError('El identificador de la recomendación (recommendationId) es obligatorio.');
        }

        const scoreNum = Number(score);

        // Regla de Negocio: Puntuación estrictamente entre 1 y 5
        if (!Number.isInteger(scoreNum) || scoreNum < 1 || scoreNum > 5) {
            throw new BadRequestError('La calificación debe ser un número entero entre 1 y 5.');
        }

        // Verificar que la recomendación exista en la base de datos
        if (this.recommendationRepository?.findById) {
            const recommendation = await this.recommendationRepository.findById(recommendationId);
            if (!recommendation) {
                throw new NotFoundError('La recomendación especificada no existe.');
            }
        }

        // Regla de Negocio: Aceptar una sola calificación por recomendación
        const existingRating = await this.ratingRepository.findOne({ recommendationId });
        if (existingRating) {
            throw new BadRequestError('Esta recomendación ya ha sido calificada previamente.');
        }

        const ratingDoc = {
            recommendationId,
            studentId,
            score: scoreNum,
            comment: comment ? comment.trim() : null, // Comentario opcional
            createdAt: new Date()
        };

        const createdRating = await this.ratingRepository.create(ratingDoc);
        logger.info(`Recomendación ${recommendationId} calificada con ${scoreNum} estrellas por el estudiante ${studentId}`);

        return createdRating;
    }

    /**
     * Mantiene la transacción ACID multidocumento con Rollback para calificación de cursos
     */
    async addRatingWithTransaction(ratingDto) {
        // Corrección de acceso al cliente nativo
        const client = Database.client || Database.getDb()?.client;
        if (!client || typeof client.startSession !== 'function') {
            throw new Error('El cliente de base de datos no soporta sesiones transaccionales en este entorno.');
        }

        const session = client.startSession();

        try {
            session.startTransaction();

            const existingRating = await this.ratingRepository.findOne(
                { courseId: ratingDto.courseId, studentId: ratingDto.studentId },
                { session }
            );

            if (existingRating) {
                throw new BadRequestError('El estudiante ya ha emitido una valoración para este curso.');
            }

            const ratingDocument = {
                courseId: ratingDto.courseId,
                studentId: ratingDto.studentId,
                score: Number(ratingDto.score),
                comment: ratingDto.comment?.trim() || null,
                courseTitle: ratingDto.courseTitle,
                courseCategory: ratingDto.courseCategory,
                studentName: ratingDto.studentName,
                createdAt: new Date()
            };

            const createdRating = await this.ratingRepository.create(ratingDocument, { session });

            const course = await this.courseRepository.findOne({ _id: ratingDto.courseId }, { session });
            if (!course) {
                throw new BadRequestError('El curso especificado no existe.');
            }

            const currentTotal = course.totalRatings || 0;
            const currentAvg = course.averageRating || 0;

            const newTotalRatings = currentTotal + 1;
            const newAverageRating = Number(
                (((currentAvg * currentTotal) + ratingDto.score) / newTotalRatings).toFixed(2)
            );

            await this.courseRepository.update(
                ratingDto.courseId,
                { averageRating: newAverageRating, totalRatings: newTotalRatings },
                { session }
            );

            await session.commitTransaction();
            logger.info(`Transacción exitosa: Calificación registrada para el curso ${ratingDto.courseTitle}`);

            return createdRating;
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
                logger.warn(`Rollback ejecutado en transacción de calificación: ${error.message}`);
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Alias compatible con rating.controller.js
     */
    async rateCourse(studentId, ratingDto) {
        return this.addRatingWithTransaction({ studentId, ...ratingDto });
    }
}