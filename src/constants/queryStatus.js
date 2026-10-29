/**
 * Clase estática inmutable que encapsula el conjunto cerrado de estados
 * del ciclo de vida de una consulta procesada por el puente (SRP & OCP).
 */
class QueryStatus {
    static PENDIENTE = 'PENDIENTE';
    static RESPONDIDA = 'RESPONDIDA';
    static SIN_RESULTADOS = 'SIN_RESULTADOS';
    static ERROR = 'ERROR';

    /**
     * Obtiene la lista de todos los estados válidos registrados en el sistema.
     */
    static get VALUES() {
        return Object.freeze([
            QueryStatus.PENDIENTE,
            QueryStatus.RESPONDIDA,
            QueryStatus.SIN_RESULTADOS,
            QueryStatus.ERROR
        ]);
    }

    /**
     * Determina si un estado suministrado es válido dentro del ciclo de vida de la consulta.
     */
    static isValid(status) {
        return QueryStatus.VALUES.includes(status);
    }
}

// Congela la clase para garantizar inmutabilidad absoluta en tiempo de ejecución
Object.freeze(QueryStatus);

module.exports = QueryStatus;