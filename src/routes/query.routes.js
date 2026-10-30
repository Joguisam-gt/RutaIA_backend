import { Router } from 'express';
import QueryController from '../controllers/query.controller.js';
import ValidatorMiddleware from '../middlewares/validator.middleware.js';
import AskQueryDTO from '../dtos/query/askQuery.dto.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

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

export default router;