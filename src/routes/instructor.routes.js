// src/routes/instructor.routes.js
import { Router } from 'express';
import instructorController from '../controllers/instructor.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Dashboard de instructor/admin
router.get(
    '/dashboard', 
    AuthMiddleware.authenticate, 
    AuthMiddleware.authorize('admin'), 
    instructorController.getDashboard
);

// ✅ NUEVO: Endpoint de Ingesta para indexar documentos (RF 05)
router.post(
    '/ingest',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    instructorController.ingestDocument
);

export default router;