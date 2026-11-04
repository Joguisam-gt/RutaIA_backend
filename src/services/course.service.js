// src/services/course.service.js
import courseRepositoryInstance from '../repositories/course.repository.js';
import RecommendationService from './recommendation.service.js';
import AppError from '../errors/appError.js';
import BadRequestError from '../errors/badRequestError.js';
import NotFoundError from '../errors/notFoundError.js';
import logger from '../utils/logger.js';

// Niveles permitidos estrictamente por el RF 03
const VALID_LEVELS = Object.freeze(['Básico', 'Intermedio', 'Avanzado']);

export default class CourseService {
    constructor(
        courseRepository = courseRepositoryInstance,
        recommendationService = new RecommendationService()
    ) {
        this.courseRepository = courseRepository;
        this.recommendationService = recommendationService;
    }

    /**
     * Valida las reglas de negocio de un curso antes de persistirlo
     * @private
     */
    _validateCourseData(data) {
        const title = (data.title || data.name || '').trim();
        const description = (data.description || '').trim();
        const duration = Number(data.durationHours || data.duration);

        // Regla: No podrán registrarse cursos sin nombre o descripción
        if (!title) {
            throw new BadRequestError('El nombre o título del curso es obligatorio.');
        }
        if (!description) {
            throw new BadRequestError('La descripción del curso es obligatoria.');
        }

        // Regla: La duración de un curso deberá ser mayor que cero
        if (isNaN(duration) || duration <= 0) {
            throw new BadRequestError('La duración del curso deberá ser mayor que cero.');
        }

        // RF 03: Aceptar los niveles Básico, Intermedio y Avanzado
        const normalizedLevel = this._normalizeLevel(data.level);
        if (!normalizedLevel) {
            throw new BadRequestError(`Nivel inválido. Los niveles permitidos son: ${VALID_LEVELS.join(', ')}.`);
        }

        return {
            title,
            description,
            duration,
            level: normalizedLevel,
            category: (data.category || 'General').trim()
        };
    }

    /**
     * Normaliza los niveles tolerando acentos y mayúsculas/minúsculas
     * @private
     */
    _normalizeLevel(level) {
        if (!level) return null;
        const clean = level.trim().toLowerCase();
        if (clean === 'básico' || clean === 'basico') return 'Básico';
        if (clean === 'intermedio') return 'Intermedio';
        if (clean === 'avanzado') return 'Avanzado';
        return null;
    }

    /**
     * Registra un curso cumpliendo todas las reglas del RF 03 y coordina con n8n/Qdrant
     */
    async createCourse(courseDto, file = null) {
        // 1. Validar reglas de negocio estrictas
        const validated = this._validateCourseData(courseDto);

        const initialCourseData = {
            title: validated.title,
            name: validated.title, // Compatibilidad con endpoints
            description: validated.description,
            category: validated.category,
            level: validated.level,
            durationHours: validated.duration,
            duration: validated.duration,
            graphNodeId: courseDto.graphNodeId || null,
            isVisible: true,
            status: 'ACTIVO',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 2. Persistir en base de datos
        const createdCourse = await this.courseRepository.create(initialCourseData);
        logger.info(`Curso '${createdCourse.title}' creado exitosamente con ID: ${createdCourse._id}`);

        // 3. Si se adjuntó PDF, procesarlo hacia n8n/Qdrant
        if (file && file.buffer) {
            if (file.mimetype !== 'application/pdf') {
                throw new BadRequestError('El archivo adjunto debe ser de tipo PDF (application/pdf).');
            }

            try {
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
                logger.info(`Ingesta vectorial finalizada en n8n para el curso: ${createdCourse._id}`);
            } catch (error) {
                logger.error(`Fallo en la ingesta vectorial para el curso ID: ${createdCourse._id}`, error.message);
                // No rompemos la transacción completa, pero dejamos registro
                await this.courseRepository.updateById(createdCourse._id, {
                    ingestError: error.message
                });
            }
        }

        return createdCourse;
    }

    /**
     * Obtiene un curso por ID garantizando existencia (RF 03)
     */
    async getCourseById(courseId) {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError('El curso solicitado no existe o ha sido desactivado.');
        }
        return course;
    }

    /**
     * Alias para compatibilidad con CourseController.getAllCourses (RF 04)
     */
    async getAllCourses(filters = {}, userRole = 'student') {
        return this.getCourses(filters, userRole);
    }

    /**
     * Consulta el catálogo de cursos activos con soporte de filtros (RF 04)
     * Regla: Solo los cursos activos podrán mostrarse a estudiantes
     */
    async getCourses(filters = {}, userRole = 'student', limit = 50, page = 1) {
        const query = {};

        // Filtro por categoría
        if (filters.category && filters.category.trim() !== '') {
            query.category = filters.category.trim();
        }

        // Filtro por nivel normalizado
        if (filters.level && filters.level.trim() !== '') {
            const normalized = this._normalizeLevel(filters.level);
            if (normalized) query.level = normalized;
        }

        // RF 04: Mostrar únicamente cursos activos a estudiantes
        if (userRole !== 'admin') {
            query.isVisible = true;
            query.status = 'ACTIVO';
        }

        return await this.courseRepository.findWithPagination(query, limit, page);
    }

    /**
     * Actualiza información de un curso validando existencia y reglas de negocio
     */
    async updateCourse(courseId, updateDto) {
        await this.getCourseById(courseId);

        // Si se actualizan campos críticos, validar reglas
        if (updateDto.duration !== undefined || updateDto.durationHours !== undefined) {
            const dur = Number(updateDto.durationHours ?? updateDto.duration);
            if (isNaN(dur) || dur <= 0) {
                throw new BadRequestError('La duración del curso deberá ser mayor que cero.');
            }
        }

        if (updateDto.level) {
            const normalized = this._normalizeLevel(updateDto.level);
            if (!normalized) {
                throw new BadRequestError(`Nivel inválido. Los niveles permitidos son: ${VALID_LEVELS.join(', ')}.`);
            }
            updateDto.level = normalized;
        }

        const updatedCourse = await this.courseRepository.updateById(courseId, {
            ...updateDto,
            updatedAt: new Date()
        });

        logger.info(`Curso ID: ${courseId} actualizado correctamente.`);
        return updatedCourse;
    }

    /**
     * Desactiva un curso lógicamente (RF 03 y Reglas de Negocio)
     * Regla: No se borra físicamente para preservar la integridad de las recomendaciones
     */
    async deleteCourse(courseId) {
        await this.getCourseById(courseId);

        // Desactivación lógica
        const deactivatedCourse = await this.courseRepository.updateById(courseId, {
            isVisible: false,
            status: 'INACTIVO',
            updatedAt: new Date()
        });

        logger.info(`Curso ID: ${courseId} desactivado lógicamente del catálogo.`);
        return deactivatedCourse;
    }
}