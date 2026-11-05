// src/constants/queryStatus.js

/**
 * Estados oficiales de las consultas según RF 07 y Reglas de Negocio de RutaIA.
 */
export const queryStatus = Object.freeze({
    PENDING: 'Pendiente',
    ANSWERED: 'Respondida',
    NO_RESULTS: 'Sin resultados',
    ERROR: 'Error'
});

export default queryStatus;