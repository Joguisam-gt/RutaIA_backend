import UserLevels from '../../constants/userLevels.js';
import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO orientado a objetos para la actualización parcial de cursos (SRP & OCP).
 * Valida de forma opcional únicamente los campos proporcionados en la petición.
 */
export default class UpdateCourseDTO {
    /**
     * Objeto con las propiedades opcionales a modificar.
     * Título del curso.
     * Descripción del contenido.
     * Categoría asignada.
     * Nivel de dificultad (PRINCIPIANTE, INTERMEDIO, AVANZADO).
     * Duración en horas (> 0).
     * Identificador del nodo del grafo.
     *  Estado de visibilidad.
     */
    constructor(data = {}) {
        this._validateHasFields(data);

        if (data.title !== undefined) {
            this.title = UpdateCourseDTO._validateTitle(data.title);
        }
        if (data.description !== undefined) {
            this.description = UpdateCourseDTO._validateDescription(data.description);
        }
        if (data.category !== undefined) {
            this.category = UpdateCourseDTO._validateCategory(data.category);
        }
        if (data.level !== undefined) {
            this.level = UpdateCourseDTO._validateLevel(data.level);
        }
        if (data.durationHours !== undefined) {
            this.durationHours = UpdateCourseDTO._validateDurationHours(data.durationHours);
        }
        if (data.graphNodeId !== undefined) {
            this.graphNodeId = UpdateCourseDTO._validateGraphNodeId(data.graphNodeId);
        }
        if (data.isVisible !== undefined) {
            this.isVisible = UpdateCourseDTO._validateIsVisible(data.isVisible);
        }

        // Garantiza inmutabilidad del objeto validado
        Object.freeze(this);
    }

    /**
     * Verifica que la petición contenga al menos un campo para actualizar.
     * @private
     */
    _validateHasFields(data) {
        const allowedKeys = ['title', 'description', 'category', 'level', 'durationHours', 'graphNodeId', 'isVisible'];
        const hasValidKey = Object.keys(data).some((key) => allowedKeys.includes(key) && data[key] !== undefined);

        if (!hasValidKey) {
            throw new BadRequestError('Debe proporcionar al menos un campo válido para realizar la actualización parcial.');
        }
    }

    static _validateTitle(title) {
        if (typeof title !== 'string' || title.trim().length < 3) {
            throw new BadRequestError('El título del curso debe ser un texto de al menos 3 caracteres.');
        }
        return title.trim();
    }

    static _validateDescription(description) {
        if (typeof description !== 'string' || description.trim().length < 10) {
            throw new BadRequestError('La descripción del curso debe contener al menos 10 caracteres.');
        }
        return description.trim();
    }

    static _validateCategory(category) {
        if (typeof category !== 'string' || category.trim().length < 2) {
            throw new BadRequestError('La categoría debe ser una cadena válida.');
        }
        return category.trim();
    }

    static _validateLevel(level) {
        if (!UserLevels.isValid(level)) {
            throw new BadRequestError(`El nivel especificado es inválido. Permitidos: ${UserLevels.VALUES.join(', ')}.`);
        }
        return UserLevels.sanitize(level);
    }

    static _validateDurationHours(durationHours) {
        const numericDuration = Number(durationHours);
        if (isNaN(numericDuration) || numericDuration <= 0) {
            throw new BadRequestError('La duración debe ser un valor numérico estrictamente mayor a 0.');
        }
        return numericDuration;
    }

    static _validateGraphNodeId(graphNodeId) {
        if (graphNodeId !== null && typeof graphNodeId !== 'string') {
            throw new BadRequestError('El nodo del grafo debe ser una cadena de texto o nulo.');
        }
        return graphNodeId ? graphNodeId.trim() : null;
    }

    static _validateIsVisible(isVisible) {
        if (typeof isVisible !== 'boolean') {
            throw new BadRequestError('El estado de visibilidad debe ser un valor booleano (true/false).');
        }
        return isVisible;
    }

    /**
     * Método de fábrica estático para instanciar el DTO desde la petición HTTP.
     * @param {Object} body - req.body
     * @returns {UpdateCourseDTO}
     */
    static fromRequest(body) {
        return new UpdateCourseDTO(body || {});
    }
}