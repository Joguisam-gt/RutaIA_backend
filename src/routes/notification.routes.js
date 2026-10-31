import { Router } from 'express';
import NotificationController from '../controllers/notification.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const notificationController = new NotificationController();

// Todas las rutas requieren autenticación previa
router.use(AuthMiddleware.authenticate);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

export default router;