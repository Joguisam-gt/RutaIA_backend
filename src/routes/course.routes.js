// src/routes/course.routes.js
import { Router } from 'express';
import courseController from '../controllers/course.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

class CourseRoutes {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        /**
         * @route   GET /api/v1/courses
         * @desc    Consulta el catálogo con filtros (RF 04). 
         *          Público/Estudiante: solo activos. Admin: todos.
         */
        this.router.get(
            '/', 
            AuthMiddleware.optionalAuthenticate, 
            courseController.getAllCourses
        );

        /**
         * @route   GET /api/v1/courses/:id
         * @desc    Obtiene el detalle de un curso específico (RF 03)
         */
        this.router.get(
            '/:id', 
            AuthMiddleware.optionalAuthenticate, 
            courseController.getCourseById
        );

        /**
         * @route   POST /api/v1/courses
         * @desc    Crea un nuevo curso (RF 03)
         * @access  Privado (Solo Administradores)
         */
        this.router.post(
            '/', 
            AuthMiddleware.authenticate, 
            AuthMiddleware.authorize('admin'), 
            courseController.createCourse
        );

        /**
         * @route   PUT /api/v1/courses/:id
         * @desc    Actualiza la información de un curso (RF 03)
         * @access  Privado (Solo Administradores)
         */
        this.router.put(
            '/:id', 
            AuthMiddleware.authenticate, 
            AuthMiddleware.authorize('admin'), 
            courseController.updateCourse
        );

        /**
         * @route   DELETE /api/v1/courses/:id
         * @desc    Desactiva lógicamente un curso (RF 03 y Reglas de Negocio)
         * @access  Privado (Solo Administradores)
         */
        this.router.delete(
            '/:id', 
            AuthMiddleware.authenticate, 
            AuthMiddleware.authorize('admin'), 
            courseController.deleteCourse
        );
    }
}

export default new CourseRoutes().router;