// src/dtos/query/askQuery.dto.js
import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO orientado a objetos para la recepción y validación de consultas hacia la IA (SRP & OCP).
 */
export default class AskQueryDTO {
    /**
     * Carga útil enviada en la petición HTTP.
     * ID del estudiante (o student_id).
     * Alias en formato snake_case.
     * Texto de la pregunta realizada a la IA.
     * Categoría opcional seleccionada para acotar la búsqueda.
     */
    constructor({ studentId, student_id, question, category }) {
        const rawStudentId = studentId || student_id;
        this.studentId = AskQueryDTO._validateStudentId(rawStudentId);
        this.question = AskQueryDTO._validateQuestion(question);
        this.category = AskQueryDTO._validateCategory(category);

        // Congela el DTO para garantizar inmutabilidad
        Object.freeze(this);
    }

    /**
     * Valida que el identificador del estudiante exista y sea una cadena no vacía.
     * @private
     */
    static _validateStudentId(studentId) {
        if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
            throw new BadRequestError('El identificador del estudiante (student_id) es obligatorio y no puede estar vacío.');
        }
        return studentId.trim();
    }

    /**
     * Valida que la pregunta exista, sea una cadena de texto y contenga contenido sustancial.
     */
    static _validateQuestion(question) {
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            throw new BadRequestError('La pregunta (question) es obligatoria y no puede estar vacía.');
        }
        if (question.trim().length < 3) {
            throw new BadRequestError('La pregunta debe contener al menos 3 caracteres.');
        }
        return question.trim();
    }

    /**
     * Sanitiza la categoría opcional de filtrado.
     */
    static _validateCategory(category) {
        if (category && typeof category !== 'string') {
            throw new BadRequestError('La categoría enviada debe ser un texto válido.');
        }
        return category ? category.trim() : null;
    }

    /**
     * Método de fábrica estático para construir la instancia desde el cuerpo de la petición.
     * @param {Object} body - req.body
     * @returns {AskQueryDTO}
     */
    static fromRequest(body = {}) {
        return new AskQueryDTO(body);
    }
}