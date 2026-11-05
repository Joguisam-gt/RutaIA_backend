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
        // Catalogo publico con filtros opcionales
        this.router.get(
            '/', 
            AuthMiddleware.optionalAuthenticate, 
            courseController.getAllCourses
        );

        // Endpoint de Grafo (Debe registrarse ANTES de /:id para evitar colisiones)
        this.router.get(
            '/graph', 
            courseController.getCourseGraph
        );

        // Detalle de un curso
        this.router.get(
            '/:id', 
            AuthMiddleware.optionalAuthenticate, 
            courseController.getCourseById
        );

        // Operaciones administrativas
        this.router.post(
            '/', 
            AuthMiddleware.authenticate, 
            AuthMiddleware.authorize('admin'), 
            courseController.createCourse
        );

        this.router.put(
            '/:id', 
            AuthMiddleware.authenticate, 
            AuthMiddleware.authorize('admin'), 
            courseController.updateCourse
        );

        this.router.delete(
            '/:id', 
            AuthMiddleware.authenticate, 
            AuthMiddleware.authorize('admin'), 
            courseController.deleteCourse
        );
    }
}

export default new CourseRoutes().router;