// src/controllers/course.controller.js
import CourseService from '../services/course.service.js';

export class CourseController {
    /**
     * Permite inyección de dependencias (DIP de SOLID)
     * @param {CourseService} courseService 
     */
    constructor(courseService = CourseService) {
        this.courseService = courseService;
    }

    /**
     * Obtiene el catálogo de cursos con soporte de filtros (RF 04)
     * GET /api/v1/courses?category=...&level=...
     */
    getAllCourses = async (req, res, next) => {
        try {
            // Extraemos filtros opcionales de req.query según RF 04
            const { category, level, status } = req.query;
            const filters = { category, level, status };

            const courses = await this.courseService.getAllCourses(filters);

            return res.status(200).json({
                success: true,
                count: courses.length,
                data: courses
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Consulta un curso por su ID (RF 03)
     * GET /api/v1/courses/:id
     */
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

    /**
     * Registra un nuevo curso en el sistema (RF 03)
     * POST /api/v1/courses
     */
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

    /**
     * Actualiza la información de un curso existente (RF 03)
     * PUT /api/v1/courses/:id
     */
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

    /**
     * Desactiva un curso lógicamente (RF 03 y Reglas de Negocio)
     * DELETE /api/v1/courses/:id
     */
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

// Exportamos la instancia única (Singleton) por defecto y la clase nombrada
export default new CourseController();