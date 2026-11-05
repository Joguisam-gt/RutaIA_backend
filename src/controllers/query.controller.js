// src/controllers/query.controller.js
import QueryService from '../services/query.service.js';
import AppErrorImport from '../errors/appError.js';
import BadRequestErrorImport from '../errors/badRequestError.js';

// Compatibilidad de importaciones
const AppError = AppErrorImport?.AppError || AppErrorImport || Error;
const BadRequestError = BadRequestErrorImport?.BadRequestError || BadRequestErrorImport || AppError;

export class QueryController {
    constructor(queryService = new QueryService()) {
        this.queryService = queryService;
    }

    /**
     * Procesa una consulta en lenguaje natural hacia el flujo RAG (RF 06)
     * Accesible tanto para Estudiantes autenticados como para Invitados (Guest).
     * POST /api/v1/queries/ask
     */
    ask = async (req, res, next) => {
        try {
            const rawQuestion = req.body.question || req.body.prompt || req.body.query;

            // Regla de Negocio: Las preguntas vacías no deberán enviarse a n8n
            if (!rawQuestion || typeof rawQuestion !== 'string' || rawQuestion.trim() === '') {
                throw new BadRequestError('La pregunta no puede estar vacía.');
            }

            // Detección flexible del usuario (Autenticado vs Guest)
            const isGuest = !req.user;
            const studentId = req.user?.id || req.user?._id || req.user?.sub || req.body.studentId || null;
            const studentEmail = req.user?.email || null;
            
            // Preferencias del usuario o valores por defecto para Guest
            const studentLevel = req.user?.level || req.body.studentLevel || 'Principiante';
            const studentAreaOfInterest = 
                req.user?.areaOfInterest || 
                req.user?.interestArea || 
                req.body.studentAreaOfInterest || 
                'Tecnología';

            const payload = {
                studentId,
                studentEmail,
                studentLevel,
                studentAreaOfInterest,
                question: rawQuestion.trim(),
                isGuest
            };

            // Ejecuta el flujo RAG a través del servicio y n8n
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
     * (Este endpoint SÍ es estrictamente privado y requiere autenticación)
     */
    getHistory = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id || req.user?.sub;

            if (!studentId) {
                throw new AppError('No autorizado. Debes iniciar sesión para consultar tu historial.', 401);
            }

            const history = await this.queryService.getStudentHistory(studentId);

            return res.status(200).json({
                success: true,
                count: Array.isArray(history) ? history.length : 0,
                data: history
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new QueryController();