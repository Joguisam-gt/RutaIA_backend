/**
 * Clase estática inmutable que encapsula los niveles de dificultad
 * estandarizados para los cursos en el sistema (SRP & OCP).
 */
class UserLevels {
    static PRINCIPIANTE = 'PRINCIPIANTE';
    static INTERMEDIO = 'INTERMEDIO';
    static AVANZADO = 'AVANZADO';

    /**
     * Obtiene la lista inmutable de niveles de dificultad válidos.
     */
    static get VALUES() {
        return Object.freeze([
            UserLevels.PRINCIPIANTE,
            UserLevels.INTERMEDIO,
            UserLevels.AVANZADO
        ]);
    }

    /**
     * Valida si una cadena enviada corresponde a un nivel de dificultad permitido.
     */
    static isValid(level) {
        if (!level || typeof level !== 'string') return false;
        return UserLevels.VALUES.includes(level.toUpperCase().trim());
    }

    /**
     * Normaliza la cadena recibida al formato estándar si es válida.
     * @param {string} level - Cadena a sanitizar.
     * @returns {string|null}
     */
    static sanitize(level) {
        if (!UserLevels.isValid(level)) return null;
        return level.toUpperCase().trim();
    }
}

// Congela la definición de la clase para evitar modificaciones en tiempo de ejecución
Object.freeze(UserLevels);

module.exports = UserLevels;