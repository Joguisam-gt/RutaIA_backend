import BadRequestError from '../errors/badRequestError.js';

/**
 * Middleware orientado a objetos para la ejecución y validación centralizada de DTOs (SRP & OCP).
 * Funciona como una función de orden superior (Higher-Order Class Method) que intercepta
 * las peticiones HTTP y ejecuta la validación del DTO antes de llegar al controlador.
 */
export default class ValidatorMiddleware {
    /**
     * Genera un middleware de Express que instancia y valida un DTO específico.
     * Si la validación falla, interrumpe el flujo llamando a next(error).
     * 
     * Clase DTO a ejecutar (debe poseer 'fromRequest' o constructor).
     * Origen de los datos dentro del objeto req.
     *  Middleware de Express (req, res, next).
     */
    static validate(DtoClass, source = 'body') {
        return (req, res, next) => {
            try {
                const rawData = req[source] || {};

                // Instanciación y ejecución de validaciones internas del DTO
                const validatedDto = typeof DtoClass.fromRequest === 'function'
                    ? DtoClass.fromRequest(rawData)
                    : new DtoClass(rawData);

                // Reemplaza la carga útil cruda por la instancia DTO validada e inmutable
                req[source] = validatedDto;

                return next();
            } catch (error) {
                // Interrumpe el flujo enviando la excepción operacional al ErrorHandlerMiddleware
                if (error.isOperational) {
                    return next(error);
                }
                return next(new BadRequestError(`Falla de validación en la estructura de entrada (${source}): ${error.message}`));
            }
        };
    }
}