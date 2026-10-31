import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO para registrar la calificación dada por el estudiante a la interacción con la IA (SRP & Factory Method).
 */
export default class RateQueryDTO {
    constructor({ queryId, score, comment }) {
        this.queryId = queryId;
        this.score = score;
        this.comment = comment;

        Object.freeze(this);
    }

    static fromRequest(data) {
        if (!data.queryId) {
            throw new BadRequestError('El ID de la consulta/interacción es obligatorio.');
        }

        const numericScore = Number(data.score);

        // Validación: Puntuación entre 1.0 y 5.0 con incrementos exactos de 0.5
        const isValidScore = 
            !Number.isNaN(numericScore) &&
            numericScore >= 1.0 &&
            numericScore <= 5.0 &&
            Number.isInteger(numericScore * 2);

        if (!isValidScore) {
            throw new BadRequestError(
                'La calificación debe ser un valor entre 1.0 y 5.0 estrellas, permitiendo únicamente incrementos de 0.5 (ej. 1, 1.5, 2, 2.5, 3, etc.).'
            );
        }

        return new RateQueryDTO({
            queryId: String(data.queryId).trim(),
            score: numericScore,
            comment: data.comment ? String(data.comment).trim() : ''
        });
    }
}