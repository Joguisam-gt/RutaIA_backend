// src/routes/student.routes.js
import { Router } from 'express';
import studentController from '../controllers/student.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

class StudentRoutes {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        /**
         * @route   GET /api/v1/students/me
         * @desc    Obtiene el perfil del estudiante autenticado
         */
        this.router.get('/me', AuthMiddleware.authenticate, studentController.getProfile);

        /**
         * @route   GET /api/v1/students
         * @desc    Listar estudiantes registrados (RF 02)
         * @access  Privado (Admin o Estudiantes autenticados)
         */
        this.router.get('/', AuthMiddleware.authenticate, studentController.getAllStudents);

        /**
         * @route   GET /api/v1/students/:id
         * @desc    Consultar estudiante por identificador (RF 02)
         */
        this.router.get('/:id', AuthMiddleware.authenticate, studentController.getStudentById);

        /**
         * @route   GET /api/v1/students/:id/history
         * @desc    Consultar el historial de un estudiante (RF 02)
         */
        this.router.get('/:id/history', AuthMiddleware.authenticate, studentController.getStudentHistory);

        // Rutas complementarias UI
        this.router.get('/my-courses', AuthMiddleware.authenticate, studentController.getMyCourses);
    }
}

export default new StudentRoutes().router;