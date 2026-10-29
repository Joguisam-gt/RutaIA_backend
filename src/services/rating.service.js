import ratingRepositoryInstance from '../repositories/rating.repository.js';
import queryRepositoryInstance from '../repositories/query.repository.js';
import courseRepositoryInstance from '../repositories/course.repository.js';
import AppError from '../errors/appError.js';
import BadRequestError from '../errors/badRequestError.js';
import logger from '../utils/logger.js';

/**
 * Servicio orientado a objetos para la gestión de calificaciones y retroalimentación de recomendaciones (SRP & DIP).
 * Valida la existencia previa de la recomendación/curso y evita duplicados por estudiante.
 */
export default class RatingService {
    /**
     * Inyección de dependencias a través del constructor.
     * Instancia del repositorio de calificaciones.
     * Instancia del repositorio de consultas.
     * Instancia del repositorio de cursos.
     */
    constructor(
        ratingRepository = ratingRepositoryInstance,
        queryRepository = queryRepositoryInstance,
        courseRepository = courseRepositoryInstance
    ) {
        this.ratingRepository = ratingRepository;
        this.queryRepository = queryRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Registra la calificación dada por un estudiante a una recomendación/curso.
     *  ID del estudiante autenticado.
     *  DTO validado con la puntuación y comentarios.
     *  Registro de la calificación creada.
     */
    async rateCourse(studentId, ratingDto) {
        const { courseId, score, comment } = ratingDto;

        // 1. Verificación de existencia del curso objetivo
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new AppError('El curso que intentas calificar no existe o ha sido removido.', 404);
        }

        // 2. Verificación de calificación previa por el mismo estudiante
        const existingRating = await this.ratingRepository.findByStudentAndCourse(studentId, courseId);
        if (existingRating) {
            throw new BadRequestError('Ya has calificado esta recomendación/curso previamente.');
        }

        // 3. Creación y persistencia de la calificación en MongoDB
        const ratingData = {
            courseId,
            studentId,
            score: Number(score),
            comment: comment || '',
            createdAt: new Date()
        };

        const newRating = await this.ratingRepository.create(ratingData);
        logger.info(`Calificación de ${score} estrellas registrada para el curso ID: ${courseId} por el estudiante: ${studentId}`);

        // 4. Actualización opcional del promedio acumulado en el curso
        await this._updateCourseAverageRating(courseId);

        return newRating;
    }

    /**
     * Consulta las calificaciones de un curso específico paginadas.
     *  ID del curso.
     *  Límite de paginación.
     *  Número de página.
     */
    async getRatingsByCourse(courseId, limit = 10, page = 1) {
        return await this.ratingRepository.findByCourseId(courseId, limit, page);
    }

    /**
     * Calcula y obtiene estadísticas consolidadas de un curso.
     *  ID del curso.
     *  Objeto con promedio y total de votos.
     */
    async getCourseStats(courseId) {
        return await this.ratingRepository.getCourseStats(courseId);
    }

    /**
     * Método privado para recalcular y actualizar el promedio de estrellas en la entidad curso.
     */
    async _updateCourseAverageRating(courseId) {
        try {
            const stats = await this.ratingRepository.getCourseStats(courseId);
            if (stats && stats.totalRatings > 0) {
                await this.courseRepository.updateById(courseId, {
                    averageRating: Number(stats.averageScore.toFixed(2)),
                    totalRatings: stats.totalRatings
                });
            }
        } catch (error) {
            logger.error(`Error al recalcular promedio de calificación del curso ${courseId}: ${error.message}`);
        }
    }
}