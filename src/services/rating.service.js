import Database from '../config/database.js';
import ratingRepositoryInstance from '../repositories/rating.repository.js';
import courseRepositoryInstance from '../repositories/course.repository.js';
import BadRequestError from '../errors/badRequestError.js';
import logger from '../utils/logger.js';

/**
 * Servicio encargado de coordinar transacciones ACID multidocumento y desnormalización (SOLID).
 */
export default class RatingService {
    constructor(
        ratingRepository = ratingRepositoryInstance,
        courseRepository = courseRepositoryInstance
    ) {
        this.ratingRepository = ratingRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Registra una valoración desnormalizada y actualiza el promedio del curso en una transacción ACID con Rollback.
     * @param {CreateRatingDTO} ratingDto - DTO con datos desnormalizados.
     */
    async addRatingWithTransaction(ratingDto) {
        const client = Database.getDb().client;
        const session = client.startSession();

        try {
            // 1. Inicio explícito de la transacción ACID
            session.startTransaction();

            // 2. Verificar que el estudiante no haya calificado previamente este curso
            const existingRating = await this.ratingRepository.findOne(
                { courseId: ratingDto.courseId, studentId: ratingDto.studentId },
                { session }
            );

            if (existingRating) {
                throw new BadRequestError('El estudiante ya ha emitido una valoración para este curso.');
            }

            // 3. Insertar el documento de la valoración con datos desnormalizados
            const ratingDocument = {
                courseId: ratingDto.courseId,
                studentId: ratingDto.studentId,
                score: ratingDto.score,
                comment: ratingDto.comment,
                courseTitle: ratingDto.courseTitle,
                courseCategory: ratingDto.courseCategory,
                studentName: ratingDto.studentName
            };

            const createdRating = await this.ratingRepository.create(ratingDocument, { session });

            // 4. Recalcular el promedio y total de valoraciones del curso directamente
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

            // 5. Actualizar la colección de cursos dentro de la misma transacción
            await this.courseRepository.update(
                ratingDto.courseId,
                { averageRating: newAverageRating, totalRatings: newTotalRatings },
                { session }
            );

            // 6. Confirmación de la transacción (Commit)
            await session.commitTransaction();
            logger.info(`Transacción exitosa: Calificación registrada para el curso ${ratingDto.courseTitle}`);

            return createdRating;
        } catch (error) {
            // 7. Reversión completa de la operación en caso de falla (Rollback)
            if (session.inTransaction()) {
                await session.abortTransaction();
                logger.warn(`Rollback ejecutado en transacción de calificación: ${error.message}`);
            }
            throw error;
        } finally {
            // 8. Cierre obligatorio de la sesión
            await session.endSession();
        }
    }
}