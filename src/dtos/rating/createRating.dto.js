import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO para la creación de valoraciones con desnormalización controlada (Factory Method & SRP).
 */
export default class CreateRatingDTO {
    constructor({ courseId, studentId, score, comment, courseTitle, courseCategory, studentName }) {
        this.courseId = courseId;
        this.studentId = studentId;
        this.score = score;
        this.comment = comment;
        // Atributos desnormalizados
        this.courseTitle = courseTitle;
        this.courseCategory = courseCategory;
        this.studentName = studentName;

        Object.freeze(this);
    }

    static fromRequest(data) {
        if (!data.courseId || !data.studentId) {
            throw new BadRequestError('El ID del curso y del estudiante son obligatorios.');
        }

        const numericScore = Number(data.score);
        if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 5) {
            throw new BadRequestError('La puntuación debe ser un número entero entre 1 y 5.');
        }

        if (!data.courseTitle || !data.courseCategory || !data.studentName) {
            throw new BadRequestError('Los atributos desnormalizados (título del curso, categoría y nombre del estudiante) son requeridos.');
        }

        return new CreateRatingDTO({
            courseId: String(data.courseId),
            studentId: String(data.studentId),
            score: numericScore,
            comment: data.comment ? String(data.comment).trim() : '',
            courseTitle: String(data.courseTitle).trim(),
            courseCategory: String(data.courseCategory).trim(),
            studentName: String(data.studentName).trim()
        });
    }
}