// src/controllers/query.controller.js
import QueryService from '../services/query.service.js';
import { QueryRepository } from '../repositories/query.repository.js';
import { AppError } from '../errors/appError.js';

export class QueryController {
    constructor(queryService = null) {
        this.queryService = queryService || new QueryService(new QueryRepository());
    }

    ask = async (req, res, next) => {
        try {
            const { prompt } = req.body;

            if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
                throw new AppError('El campo "prompt" es obligatorio y no puede estar vacío.', 400);
            }

            const payload = {
                ...req.body,
                userId: req.user?.id || req.body.userId || null,
                userRole: req.user?.role || req.body.userRole || 'anonymous'
            };

            const result = await this.queryService.processQuery(payload);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    askQuery = async (req, res, next) => {
        return this.ask(req, res, next);
    };

    rate = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.body.studentId || 'anonymous';
            const result = await this.queryService.rateAIInteraction(studentId, req.body);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    rateQuery = async (req, res, next) => {
        return this.rate(req, res, next);
    };
}

export default QueryController;