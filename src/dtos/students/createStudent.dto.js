import UserLevels from '../../constants/userLevels.js';
import BadRequestError from '../../errors/badRequestError.js';

/**
 * DTO orientado a objetos para la creación y validación de datos de estudiantes (SRP & OCP).
 * Aplica reglas de sanitización e inmutabilidad.
 */
export default class CreateStudentDTO {
    constructor({ name, email, level, areaOfInterest }) {
        this.name = CreateStudentDTO._validateName(name);
        this.email = CreateStudentDTO._validateEmail(email);
        this.level = CreateStudentDTO._validateLevel(level);
        this.areaOfInterest = CreateStudentDTO._validateAreaOfInterest(areaOfInterest);

        // Inmutabilidad del DTO tras ser instanciado y validado
        Object.freeze(this);
    }

    /**
     * Valida que el nombre sea una cadena de texto de al menos 2 caracteres.
     */
    static _validateName(name) {
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            throw new BadRequestError('El nombre del estudiante es obligatorio y debe contener al menos 2 caracteres.');
        }
        return name.trim();
    }

    /**
     * Valida la estructura mediante expresión regular para asegurar un correo electrónico válido.
     */
    static _validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
            throw new BadRequestError('Debe proporcionar una dirección de correo electrónico válida.');
        }
        return email.trim().toLowerCase();
    }

    /**
     * Comprueba que el nivel corresponda a las constantes permitidas en UserLevels.
     */
    static _validateLevel(level) {
        if (!level || !UserLevels.isValid(level)) {
            throw new BadRequestError(`El nivel de experiencia es inválido. Valores permitidos: ${UserLevels.VALUES.join(', ')}.`);
        }
        return UserLevels.sanitize(level);
    }

    /**
     * Sanitiza el área de interés o le asigna un valor por defecto si no es enviada.
     * @private
     */
    static _validateAreaOfInterest(areaOfInterest) {
        if (areaOfInterest && typeof areaOfInterest !== 'string') {
            throw new BadRequestError('El área de interés debe ser una cadena de texto.');
        }
        return areaOfInterest ? areaOfInterest.trim() : 'General';
    }

    /**
     * Método de fábrica estático para instanciar el DTO directamente desde req.body.
     */
    static fromRequest(body) {
        return new CreateStudentDTO(body || {});
    }
}