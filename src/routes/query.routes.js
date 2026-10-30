import { Router } from 'express';
import QueryController from '../controllers/query.controller.js';
import ValidatorMiddleware from '../middlewares/validator.middleware.js';
import AskQueryDTO from '../dtos/query/askQuery.dto.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';
import RateQueryDTO from '../dtos/query/rateQuery.dto.js';

const router = Router();
const queryController = new QueryController();

// Enviar pregunta a la IA a través de n8n
router.post(
  '/ask',
  AuthMiddleware.authenticate,
  ValidatorMiddleware.validate(AskQueryDTO),
  queryController.askQuery
);

// Obtener historial de consultas del estudiante
router.get(
  '/history',
  AuthMiddleware.authenticate,
  queryController.getQueryHistory
);

// Métricas de uso de la IA (exclusivo Administrador)
router.get(
  '/metrics',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize('admin'),
  queryController.getAdminMetrics
);

// Endpoint para que el estudiante califique la interacción
router.post(
    '/rate',
    AuthMiddleware.authenticate,
    ValidatorMiddleware.validate(RateQueryDTO),
    queryController.rateAIInteraction
);

// Endpoint para que el Administrador vea los ratings de la IA junto con el chat
router.get(
    '/admin/ai-ratings',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    queryController.getAIRatingsForAdmin
);

export default router;