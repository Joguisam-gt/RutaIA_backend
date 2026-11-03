import QueryService from '../services/query.service.js';
import { QueryRepository } from '../repositories/query.repository.js';

/**
 * Controlador de peticiones relacionadas con el Chat e Interacciones de IA.
 */
export class QueryController {
  /**
   * Inyección de dependencias con fallback automático al repositorio e instancia de QueryService.
   * @param {QueryService} queryService - Instancia de servicio de consultas.
   */
  constructor(queryService = null) {
    // Si no se inyecta un servicio (ej. en rutas principales), crea una instancia con el repositorio por defecto
    this.queryService = queryService || new QueryService(new QueryRepository());
  }

  /**
   * Endpoint handler para procesar preguntas del usuario.
   */
  async ask(req, res, next) {
    try {
      const result = await this.queryService.processQuery(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint handler para calificar respuestas de IA.
   */
  async rate(req, res, next) {
    try {
      const result = await this.queryService.rateQuery(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default QueryController;