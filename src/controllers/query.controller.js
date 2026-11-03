// src/controllers/query.controller.js
import QueryService from '../services/query.service.js';
import { QueryRepository } from '../repositories/query.repository.js';

/**
 * Controlador de peticiones relacionadas con el Chat e Interacciones de IA.
 * Aplica el principio SRP separando la capa HTTP de la lógica de negocio del servicio.
 */
export class QueryController {
    /**
     * Inyección de dependencias con fallback automático al repositorio e instancia de QueryService.
     * @param {QueryService} queryService - Instancia de servicio de consultas.
     */
    constructor(queryService = null) {
        this.queryService = queryService || new QueryService(new QueryRepository());
    }

    /**
     * Manejador de endpoint para procesar preguntas del usuario hacia la IA.
     * Se utiliza función flecha para mantener el binding automático del 'this'.
     */
    ask = async (req, res, next) => {
        try {
            const result = await this.queryService.processQuery(req.body);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Alias de compatibilidad para ask.
     */
    askQuery = async (req, res, next) => {
        return this.ask(req, res, next);
    };

    /**
     * Manejador de endpoint para calificar respuestas de IA.
     */
    rate = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.body.studentId || 'anonymous';
            const result = await this.queryService.rateAIInteraction(studentId, req.body);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Alias de compatibilidad para rate.
     */
    rateQuery = async (req, res, next) => {
        return this.rate(req, res, next);
    };
}

export default QueryController;