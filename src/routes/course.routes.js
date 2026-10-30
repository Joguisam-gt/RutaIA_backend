import { Router } from 'express';
import multer from 'multer';
import CourseController from '../controllers/course.controller.js';
import ValidatorMiddleware from '../middlewares/validator.middleware.js';
import CreateCourseDTO from '../dtos/course/createCourse.dto.js';
import UpdateCourseDTO from '../dtos/course/updateCourse.dto.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const courseController = new CourseController();

// Configuración de Multer para parsear PDFs en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } 
});

// Crear curso y subir PDF a n8n (exclusivo Administrador)
router.post(
    '/',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    upload.single('pdf'),
    ValidatorMiddleware.validate(CreateCourseDTO),
    courseController.createCourse
);

// Listar catálogo de cursos (Estudiantes y Administrador)
router.get('/', courseController.getCourses);

// Obtener detalle de un curso
router.get('/:id', courseController.getCourseById);

// Actualizar información parcial de un curso (exclusivo Administrador)
router.put(
    '/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    ValidatorMiddleware.validate(UpdateCourseDTO),
    courseController.updateCourse
);

// Alternar estado de visibilidad del curso (exclusivo Administrador)
router.patch(
    '/:id/visibility',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    courseController.toggleVisibility
);

// Eliminar un curso (exclusivo Administrador)
router.delete(
    '/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    courseController.deleteCourse
);

export default router;