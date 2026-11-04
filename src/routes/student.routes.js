// src/routes/student.routes.js
import { Router } from 'express';
import StudentController from '../controllers/student.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const studentController = new StudentController();

router.get('/my-courses', authMiddleware, studentController.getMyCourses);
router.get('/profile', authMiddleware, studentController.getProfile);
router.get('/metrics', authMiddleware, studentController.getMetrics);
router.get('/certificates', authMiddleware, studentController.getCertificates);
router.get('/wishlist', authMiddleware, studentController.getWishlist);

export default router;