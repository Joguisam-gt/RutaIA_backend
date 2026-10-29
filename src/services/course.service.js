import courseRepositoryInstance from '../repositories/course.repository.js';
import RecommendationService from './recommendation.service.js';
import AppError from '../errors/appError.js';
import BadRequestError from '../errors/badRequestError.js';
import logger from '../utils/logger.js';

/**
 * Servicio orientado a objetos para la gestión del ciclo de vida y reglas de negocio de cursos (SRP & DIP).
 * Aplica reglas de visibilidad, validación de archivos PDF y coordina la ingesta con n8n.
 */
export default class CourseService {
    /**
     * Inyección de dependencias a través del constructor.
     * Instancia del repositorio de cursos.
     *  Instancia del cliente HTTP hacia n8n.
     */
    constructor(
        courseRepository = courseRepositoryInstance,
        recommendationService = new RecommendationService()
    ) {
        this.courseRepository = courseRepository;
        this.recommendationService = recommendationService;
    }

    /**
     * Registra un curso en MongoDB y delega la ingesta del PDF al webhook en n8n para generación de vectores.
     *  DTO con datos validados del curso.
     *  Objeto del archivo PDF subido (Multer).
     *  Documento del curso registrado.
     */
    async createCourse(courseDto, file) {
        // 1. Validación de presencia y formato del archivo PDF
        if (!file || !file.buffer) {
            throw new BadRequestError('Es obligatorio adjuntar un archivo PDF con el contenido del curso.');
        }
        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestError('El archivo adjunto debe ser de tipo PDF (application/pdf).');
        }

        // 2. Creación inicial en MongoDB en estado PENDIENTE_INGESTA
        const initialCourseData = {
            title: courseDto.title,
            description: courseDto.description,
            category: courseDto.category,
            level: courseDto.level,
            durationHours: Number(courseDto.durationHours),
            graphNodeId: courseDto.graphNodeId || null,
            isVisible: true,
            status: 'PENDIENTE_INGESTA'
        };

        const createdCourse = await this.courseRepository.create(initialCourseData);
        logger.info(`Curso '${createdCourse.title}' creado en MongoDB con ID: ${createdCourse._id}. Iniciando ingesta a n8n...`);

        try {
            // 3. Retransmisión del buffer PDF hacia el Webhook de n8n (Cerebro IA / Qdrant)
            await this.recommendationService.processCoursePdf(
                createdCourse._id,
                file.buffer,
                file.originalname,
                file.mimetype,
                {
                    title: createdCourse.title,
                    category: createdCourse.category,
                    level: createdCourse.level,
                    graphNodeId: createdCourse.graphNodeId
                }
            );

            // 4. Actualización del curso a estado ACTIVO tras la ingesta exitosa
            const activeCourse = await this.courseRepository.updateById(createdCourse._id, {
                status: 'ACTIVO'
            });

            logger.info(`Ingesta vectorial finalizada en n8n. Curso ID: ${createdCourse._id} marcado como ACTIVO.`);
            return activeCourse;
        } catch (error) {
            logger.error(`Fallo en la ingesta vectorial para el curso ID: ${createdCourse._id}. Marcando como ERROR_INGESTA.`, error.message);

            await this.courseRepository.updateById(createdCourse._id, {
                status: 'ERROR_INGESTA',
                ingestError: error.message
            });

            throw error;
        }
    }

    /**
     * Obtiene un curso por su ID garantizando su existencia.
     * ID del curso en MongoDB.
     * 
     */
    async getCourseById(courseId) {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new AppError('El curso solicitado no existe o ha sido eliminado.', 404);
        }
        return course;
    }

    /**
     * Consulta el catálogo de cursos aplicando reglas de visibilidad por rol.
     *  Filtros de categoría y nivel.
     *  Rol del usuario que realiza la consulta ('student' o 'admin').
     *  Límite de paginación.
     * Número de página.
     */
    async getCourses(filters = {}, userRole = 'student', limit = 20, page = 1) {
        const query = {};

        // Filtros dinámicos por categoría y nivel
        if (filters.category) query.category = filters.category.trim();
        if (filters.level) query.level = filters.level.trim().toUpperCase();

        // Regla de negocio: Los estudiantes solo pueden ver cursos visibles y activos
        if (userRole !== 'admin') {
            query.isVisible = true;
            query.status = 'ACTIVO';
        }

        return await this.courseRepository.findWithPagination(query, limit, page);
    }

    /**
     * Actualiza parcialmente la información de un curso.
     * @param {string} courseId - ID del curso.
     * @param {UpdateCourseDTO} updateDto - DTO con campos validados a modificar.
     * @returns {Promise<Object>}
     */
    async updateCourse(courseId, updateDto) {
        await this.getCourseById(courseId); // Verifica existencia previa

        const updatedCourse = await this.courseRepository.updateById(courseId, { ...updateDto });
        logger.info(`Curso ID: ${courseId} actualizado correctamente.`);

        return updatedCourse;
    }

    /**
     * Modifica el estado de visibilidad pública de un curso para los estudiantes.
     * @param {string} courseId - ID del curso.
     * @param {boolean} isVisible - Estado de visibilidad.
     * @returns {Promise<Object>}
     */
    async changeCourseVisibility(courseId, isVisible) {
        await this.getCourseById(courseId);

        const updatedCourse = await this.courseRepository.updateById(courseId, { isVisible });
        logger.info(`Visibilidad del curso ID: ${courseId} modificada a: ${isVisible}`);

        return updatedCourse;
    }

    /**
     * Elimina un curso de la base de datos de persistencia.
     * @param {string} courseId - ID del curso.
     * @returns {Promise<boolean>}
     */
    async deleteCourse(courseId) {
        await this.getCourseById(courseId);

        const deleted = await this.courseRepository.deleteById(courseId);
        logger.info(`Curso ID: ${courseId} eliminado del sistema.`);

        return deleted;
    }
}