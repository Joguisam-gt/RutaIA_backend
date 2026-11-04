import { Router } from 'express';
import StudentController from '../controllers/student.controller.js';
import StudentService from '../services/student.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Instanciar el servicio
const studentService = new StudentService();

// 2. Inyectar el servicio en el controlador
const studentController = new StudentController(studentService);

// 3. Definir rutas (sin duplicados)
router.get('/my-courses', authMiddleware, studentController.getMyCourses);
router.get('/profile', authMiddleware, studentController.getProfile);
router.get('/metrics', authMiddleware, studentController.getMetrics);
router.get('/certificates', authMiddleware, studentController.getCertificates);
router.get('/wishlist', authMiddleware, studentController.getWishlist);

export default router;