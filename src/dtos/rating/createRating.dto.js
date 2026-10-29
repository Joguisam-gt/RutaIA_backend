import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO orientado a objetos para la recepción y validación de calificaciones de cursos (SRP & OCP).
 * Valida la puntuación (score / stars) entre 1 y 5 y maneja comentarios opcionales.
 */
export default class CreateRatingDTO {
    /**
     * Datos enviados en la petición HTTP.
     * ID del curso a calificar.
     * Alias en formato snake_case.
     * Puntuación numérica del 1 al 5.
     * Alias de la puntuación.
     * Comentario o reseña opcional sobre el curso recomendación.
     */
    constructor({ courseId, course_id, score, stars, comment }) {
        const rawCourseId = courseId || course_id;
        const rawScore = score !== undefined ? score : stars;

        this.courseId = CreateRatingDTO._validateCourseId(rawCourseId);
        this.score = CreateRatingDTO._validateScore(rawScore);
        this.comment = CreateRatingDTO._validateComment(comment);

        // Garantiza la inmutabilidad de la instancia validada
        Object.freeze(this);
    }

    /**
     * Valida que el identificador del curso exista y sea una cadena no vacía.
     */
    static _validateCourseId(courseId) {
        if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
            throw new BadRequestError('El identificador del curso (courseId) es obligatorio.');
        }
        return courseId.trim();
    }

    /**
     * Valida que score sea un número entero comprendido estrictamente entre 1 y 5.
     */
    static _validateScore(score) {
        const numericScore = Number(score);

        if (
            score === undefined ||
            score === null ||
            isNaN(numericScore) ||
            !Number.isInteger(numericScore) ||
            numericScore < 1 ||
            numericScore > 5
        ) {
            throw new BadRequestError('La puntuación (score) es obligatoria, debe ser un número entero entre 1 y 5.');
        }

        return numericScore;
    }

    /**
     * Valida que el comentario sea una cadena de texto opcional y lo sanitiza.
     * @private
     */
    static _validateComment(comment) {
        if (comment !== undefined && comment !== null) {
            if (typeof comment !== 'string') {
                throw new BadRequestError('El comentario debe ser una cadena de texto válida.');
            }
            return comment.trim();
        }
        return '';
    }

    /**
     * Método de fábrica estático para instanciar el DTO desde la petición HTTP.
     */
    static fromRequest(body = {}) {
        return new CreateRatingDTO(body);
    }
}