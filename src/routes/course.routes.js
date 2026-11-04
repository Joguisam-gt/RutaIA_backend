// src/routes/course.routes.js
import { Router } from 'express';
import CourseController from '../controllers/course.controller.js';
import { authMiddleware, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
const courseController = new CourseController();

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', authMiddleware, authorize('admin'), courseController.createCourse);
router.put('/:id', authMiddleware, authorize('admin'), courseController.updateCourse);
router.delete('/:id', authMiddleware, authorize('admin'), courseController.deleteCourse);

export default router;