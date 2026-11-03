// Principio SRP (Single Responsibility Principle): Encapsula las constantes de estado de las consultas procesadas por la IA y el backend proxy.

/**
 * Diccionario inmutable con los estados posibles de una consulta registrada en la base de datos.
 */
export const queryStatus = Object.freeze({
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
});

// Exportación por defecto para mantener soporte con sintaxis: import queryStatus from '../constants/queryStatus.js';
export default queryStatus;