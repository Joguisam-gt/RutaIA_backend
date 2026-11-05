// src/controllers/query.controller.js
import QueryService from '../services/query.service.js';
import { AppError } from '../errors/appError.js';
import { BadRequestError } from '../errors/badRequestError.js';

export class QueryController {
    constructor(queryService = new QueryService()) {
        this.queryService = queryService;
    }

    /**
     * Procesa una consulta en lenguaje natural (RF 06)
     * POST /api/v1/queries
     */
    ask = async (req, res, next) => {
        try {
            const rawQuestion = req.body.question || req.body.prompt;

            // Regla: Las preguntas vacías no deberán enviarse a n8n
            if (!rawQuestion || typeof rawQuestion !== 'string' || rawQuestion.trim() === '') {
                throw new BadRequestError('La pregunta no puede estar vacía.');
            }

            // Regla: Toda consulta deberá pertenecer a un estudiante existente
            if (!req.user || !req.user.id) {
                throw new AppError('Usuario no autenticado. Se requiere iniciar sesión como estudiante.', 401);
            }

            const payload = {
                studentId: req.user.id,
                studentEmail: req.user.email,
                studentLevel: req.user.level || 'Principiante',
                studentAreaOfInterest: req.user.areaOfInterest || req.user.interestArea || 'Tecnología',
                question: rawQuestion.trim()
            };

            const result = await this.queryService.processQuery(payload);

            return res.status(200).json({
                success: true,
                message: 'Consulta procesada correctamente.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    askQuery = async (req, res, next) => this.ask(req, res, next);

    /**
     * Consulta el historial de consultas del estudiante autenticado (RF 16)
     * GET /api/v1/queries/history
     */
    getHistory = async (req, res, next) => {
        try {
            const studentId = req.user?.id;
            const history = await this.queryService.getStudentHistory(studentId);

            return res.status(200).json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new QueryController();