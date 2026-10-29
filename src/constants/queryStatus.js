export default class QueryStatus {
    static PENDIENTE = 'PENDIENTE';
    static RESPONDIDA = 'RESPONDIDA';
    static SIN_RESULTADOS = 'SIN_RESULTADOS';
    static ERROR = 'ERROR';

    static get VALUES() {
        return Object.freeze([
            QueryStatus.PENDIENTE,
            QueryStatus.RESPONDIDA,
            QueryStatus.SIN_RESULTADOS,
            QueryStatus.ERROR
        ]);
    }

    static isValid(status) {
        return QueryStatus.VALUES.includes(status);
    }
}

Object.freeze(QueryStatus);