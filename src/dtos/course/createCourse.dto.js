import UserLevels from '../../constants/userLevels.js';
import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO orientado a objetos para la creación y validación de cursos (SRP & OCP).
 * Valida título, descripción, categoría, nivel y duración antes de ingresar al servicio.
 */
export default class CreateCourseDTO {
    /**
     * Datos del curso recibidos en la petición HTTP.
     * Título o nombre del curso.
     *  Descripción detallada del contenido del curso.
     *  Categoría a la que pertenece el curso.
     * Nivel de dificultad (PRINCIPIANTE, INTERMEDIO, AVANZADO).
     *  Duración en horas (debe ser mayor a 0).
     * Identificador del nodo del grafo de categorías.
     */
    constructor({ title, description, category, level, durationHours, graphNodeId }) {
        this.title = CreateCourseDTO._validateTitle(title);
        this.description = CreateCourseDTO._validateDescription(description);
        this.category = CreateCourseDTO._validateCategory(category);
        this.level = CreateCourseDTO._validateLevel(level);
        this.durationHours = CreateCourseDTO._validateDurationHours(durationHours);
        this.graphNodeId = CreateCourseDTO._validateGraphNodeId(graphNodeId);

        // Congela el DTO para asegurar inmutabilidad
        Object.freeze(this);
    }

    /**
     * Valida que el título sea una cadena de al menos 3 caracteres.
     */
    static _validateTitle(title) {
        if (!title || typeof title !== 'string' || title.trim().length < 3) {
            throw new BadRequestError('El título del curso es obligatorio y debe contener al menos 3 caracteres.');
        }
        return title.trim();
    }

    /**
     * Valida que la descripción contenga al menos 10 caracteres.
     * @private
     */
    static _validateDescription(description) {
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
            throw new BadRequestError('La descripción del curso es obligatoria y debe contener al menos 10 caracteres.');
        }
        return description.trim();
    }

    /**
     * Valida que la categoría sea una cadena no vacía.
     */
    static _validateCategory(category) {
        if (!category || typeof category !== 'string' || category.trim().length < 2) {
            throw new BadRequestError('La categoría del curso es obligatoria.');
        }
        return category.trim();
    }

    /**
     * Valida que el nivel pertenezca a los valores estandarizados en UserLevels.
     */
    static _validateLevel(level) {
        if (!level || !UserLevels.isValid(level)) {
            throw new BadRequestError(`El nivel del curso es inválido. Valores permitidos: ${UserLevels.VALUES.join(', ')}.`);
        }
        return UserLevels.sanitize(level);
    }

    /**
     * Valida que la duración en horas sea un número mayor que cero.
     */
    static _validateDurationHours(durationHours) {
        const numericDuration = Number(durationHours);
        if (isNaN(numericDuration) || numericDuration <= 0) {
            throw new BadRequestError('La duración del curso debe ser un número estrictamente mayor a 0 horas.');
        }
        return numericDuration;
    }

    /**
     * Sanitiza el ID opcional del nodo del grafo de categorías.
     */
    static _validateGraphNodeId(graphNodeId) {
        if (graphNodeId && typeof graphNodeId !== 'string') {
            throw new BadRequestError('El identificador del nodo del grafo debe ser una cadena de texto.');
        }
        return graphNodeId ? graphNodeId.trim() : null;
    }

    /**
     * Método de fábrica estático para instanciar el DTO desde la petición Express.
     */
    static fromRequest(body) {
        return new CreateCourseDTO(body || {});
    }
}