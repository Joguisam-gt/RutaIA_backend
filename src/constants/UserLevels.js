export default class UserLevels {
    static PRINCIPIANTE = 'PRINCIPIANTE';
    static INTERMEDIO = 'INTERMEDIO';
    static AVANZADO = 'AVANZADO';

    static get VALUES() {
        return Object.freeze([
            UserLevels.PRINCIPIANTE,
            UserLevels.INTERMEDIO,
            UserLevels.AVANZADO
        ]);
    }

    static isValid(level) {
        if (!level || typeof level !== 'string') return false;
        return UserLevels.VALUES.includes(level.toUpperCase().trim());
    }

    static sanitize(level) {
        if (!UserLevels.isValid(level)) return null;
        return level.toUpperCase().trim();
    }
}

Object.freeze(UserLevels);