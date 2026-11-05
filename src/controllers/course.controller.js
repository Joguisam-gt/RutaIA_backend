// src/controllers/course.controller.js
import CourseService from '../services/course.service.js';

export class CourseController {
    constructor(courseService = new CourseService()) {
        this.courseService = courseService;
    }

    getAllCourses = async (req, res, next) => {
        try {
            const { category, level, status } = req.query;
            const filters = { category, level, status };
            const userRole = req.user?.role || 'guest';

            const courses = await this.courseService.getAllCourses(filters, userRole);

            return res.status(200).json({
                success: true,
                count: courses.length,
                roleDetected: userRole,
                data: courses
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Obtiene la estructura de grafo para la pestaña de Administrador
     * GET /api/v1/courses/graph
     */
    getCourseGraph = async (req, res, next) => {
        try {
            const graphData = await this.courseService.getCourseGraph();
            return res.status(200).json({
                success: true,
                message: 'Grafo de cursos obtenido exitosamente.',
                data: graphData
            });
        } catch (error) {
            next(error);
        }
    };

    getCourseById = async (req, res, next) => {
        try {
            const course = await this.courseService.getCourseById(req.params.id);
            return res.status(200).json({
                success: true,
                data: course
            });
        } catch (error) {
            next(error);
        }
    };

    createCourse = async (req, res, next) => {
        try {
            const newCourse = await this.courseService.createCourse(req.body);
            return res.status(201).json({
                success: true,
                message: 'Curso creado exitosamente.',
                data: newCourse
            });
        } catch (error) {
            next(error);
        }
    };

    updateCourse = async (req, res, next) => {
        try {
            const updated = await this.courseService.updateCourse(req.params.id, req.body);
            return res.status(200).json({
                success: true,
                message: 'Curso actualizado exitosamente.',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    };

    deleteCourse = async (req, res, next) => {
        try {
            const result = await this.courseService.deleteCourse(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Curso desactivado correctamente.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new CourseController();