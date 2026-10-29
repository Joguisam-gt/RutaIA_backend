// src/controllers/course.controller.js
import CourseService from '../services/course.service.js';

/**
 * Controlador orientado a objetos para la gestión del ciclo de vida de los cursos (SRP & DIP).
 * Adapta las peticiones HTTP de creación, actualización, visibilidad y lectura
 * comunicándose con la capa de servicios.
 */
export default class CourseController {
    /**
     * Inyección de dependencias en el constructor.
     */
    constructor(courseService = new CourseService()) {
        this.courseService = courseService;

        // Preservación explícita del contexto 'this' para los middlewares de ruta de Express
        this.createCourse = this.createCourse.bind(this);
        this.getCourseById = this.getCourseById.bind(this);
        this.getCourses = this.getCourses.bind(this);
        this.updateCourse = this.updateCourse.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);
        this.deleteCourse = this.deleteCourse.bind(this);
    }

    /**
     * Registra un curso en MongoDB y retransmite el PDF adjunto a n8n para la generación de Embeddings.
     * Ruta: POST /api/v1/courses
     * Permisos: Administrador
     */
    async createCourse(req, res, next) {
        try {
            const courseDto = req.body;
            const file = req.file; // Archivo PDF parseado por Multer

            const createdCourse = await this.courseService.createCourse(courseDto, file);

            return res.status(201).json({
                success: true,
                message: 'Curso creado exitosamente y enviado a procesamiento vectorial en n8n.',
                data: createdCourse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtiene un curso específico por su ID.
     * Ruta: GET /api/v1/courses/:id
     */
    async getCourseById(req, res, next) {
        try {
            const { id } = req.params;
            const course = await this.courseService.getCourseById(id);

            return res.status(200).json({
                success: true,
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Consulta el catálogo de cursos paginado (filtra cursos ocultos si el usuario es estudiante).
     * Ruta: GET /api/v1/courses
     */
    async getCourses(req, res, next) {
        try {
            const { category, level, limit = 20, page = 1 } = req.query;
            const userRole = req.user?.role || 'student';

            const courses = await this.courseService.getCourses(
                { category, level },
                userRole,
                Number(limit),
                Number(page)
            );

            return res.status(200).json({
                success: true,
                data: courses
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualiza la información de un curso existente.
     * Ruta: PUT /api/v1/courses/:id
     * Permisos: Administrador
     */
    async updateCourse(req, res, next) {
        try {
            const { id } = req.params;
            const updateDto = req.body;

            const updatedCourse = await this.courseService.updateCourse(id, updateDto);

            return res.status(200).json({
                success: true,
                message: 'Curso actualizado correctamente.',
                data: updatedCourse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cambia el estado de visibilidad del curso (Visible / Invisible).
     * Ruta: PATCH /api/v1/courses/:id/visibility
     * Permisos: Administrador
     */
    async toggleVisibility(req, res, next) {
        try {
            const { id } = req.params;
            const { isVisible } = req.body;

            const updatedCourse = await this.courseService.changeCourseVisibility(id, isVisible);

            return res.status(200).json({
                success: true,
                message: `El curso ahora se encuentra ${isVisible ? 'visible' : 'oculto'} para los estudiantes.`,
                data: updatedCourse
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Elimina un curso de la base de datos de MongoDB.
     * Ruta: DELETE /api/v1/courses/:id
     * Permisos: Administrador
     */
    async deleteCourse(req, res, next) {
        try {
            const { id } = req.params;
            await this.courseService.deleteCourse(id);

            return res.status(200).json({
                success: true,
                message: 'Curso eliminado correctamente.'
            });
        } catch (error) {
            next(error);
        }
    }
}
