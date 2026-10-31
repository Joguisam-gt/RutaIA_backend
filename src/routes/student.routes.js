import { Router } from 'express';
import StudentController from '../controllers/student.controller.js';
import ValidatorMiddleware from '../middlewares/validator.middleware.js';
import CreateStudentDTO from '../dtos/students/createStudent.dto.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();
const studentController = new StudentController();

// Registro público de estudiante
router.post(
    '/',
    ValidatorMiddleware.validate(CreateStudentDTO),
    studentController.register
);

// Obtener perfil del estudiante autenticado
router.get(
    '/profile',
    AuthMiddleware.authenticate,
    studentController.getProfile
);

// Listar todos los estudiantes (exclusivo Administrador)
router.get(
    '/',
    AuthMiddleware.authenticate,
    AuthMiddleware.authorize('admin'),
    studentController.getAllStudents
);

export default router;