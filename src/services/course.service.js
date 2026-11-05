// src/services/course.service.js
import axios from 'axios';
import courseRepositoryInstance from '../repositories/course.repository.js';
import RecommendationService from './recommendation.service.js';
import { environment } from '../config/environment.js';
import AppError from '../errors/appError.js';
import BadRequestError from '../errors/badRequestError.js';
import NotFoundError from '../errors/notFoundError.js';
import logger from '../utils/logger.js';

const VALID_LEVELS = Object.freeze(['Básico', 'Intermedio', 'Avanzado', 'PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO']);

export default class CourseService {
    constructor(
        courseRepository = courseRepositoryInstance,
        recommendationService = new RecommendationService()
    ) {
        this.courseRepository = courseRepository;
        this.recommendationService = recommendationService;
    }

    _validateCourseData(data) {
        const title = (data.title || data.name || '').trim();
        const description = (data.description || '').trim();
        const duration = Number(data.durationHours || data.duration);

        if (!title) {
            throw new BadRequestError('El nombre o titulo del curso es obligatorio.');
        }
        if (!description) {
            throw new BadRequestError('La descripcion del curso es obligatoria.');
        }
        if (isNaN(duration) || duration <= 0) {
            throw new BadRequestError('La duracion del curso debera ser mayor que cero.');
        }

        const normalizedLevel = this._normalizeLevel(data.level);
        if (!normalizedLevel) {
            throw new BadRequestError('Nivel invalido. Los niveles permitidos son: Basico, Intermedio, Avanzado.');
        }

        return {
            title,
            description,
            duration,
            level: normalizedLevel,
            category: (data.category || 'General').trim()
        };
    }

    _normalizeLevel(level) {
        if (!level) return null;
        const clean = level.trim().toUpperCase();
        if (clean === 'BÁSICO' || clean === 'BASICO' || clean === 'PRINCIPIANTE') return 'Básico';
        if (clean === 'INTERMEDIO') return 'Intermedio';
        if (clean === 'AVANZADO') return 'Avanzado';
        return null;
    }

    async createCourse(courseDto, file = null) {
        const validated = this._validateCourseData(courseDto);

        const initialCourseData = {
            title: validated.title,
            name: validated.title,
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

        const createdCourse = await this.courseRepository.create(initialCourseData);
        logger.info(`Curso '${createdCourse.title}' creado exitosamente con ID: ${createdCourse._id}`);

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
                logger.info(`Ingesta vectorial finalizada para el curso: ${createdCourse._id}`);
            } catch (error) {
                logger.error(`Fallo en la ingesta vectorial para el curso ID: ${createdCourse._id}: ${error.message}`);
                await this.courseRepository.updateById(createdCourse._id, {
                    ingestError: error.message
                });
            }
        }

        return createdCourse;
    }

    async getCourseById(courseId) {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError('El curso solicitado no existe o ha sido desactivado.');
        }
        return course;
    }

    async getAllCourses(filters = {}, userRole = 'guest') {
        return this.getCourses(filters, userRole);
    }

    async getCourses(filters = {}, userRole = 'guest', limit = 50, page = 1) {
        const query = {};

        if (filters.category && filters.category.trim() !== '') {
            query.category = filters.category.trim();
        }

        if (filters.level && filters.level.trim() !== '') {
            const normalized = this._normalizeLevel(filters.level);
            if (normalized) query.level = normalized;
        }

        if (userRole !== 'admin') {
            query.isVisible = true;
            query.status = 'ACTIVO';
        }

        return await this.courseRepository.findWithPagination(query, limit, page);
    }

    async updateCourse(courseId, updateDto) {
        await this.getCourseById(courseId);

        if (updateDto.duration !== undefined || updateDto.durationHours !== undefined) {
            const dur = Number(updateDto.durationHours ?? updateDto.duration);
            if (isNaN(dur) || dur <= 0) {
                throw new BadRequestError('La duracion del curso debera ser mayor que cero.');
            }
        }

        if (updateDto.level) {
            const normalized = this._normalizeLevel(updateDto.level);
            if (!normalized) {
                throw new BadRequestError('Nivel invalido. Los niveles permitidos son: Basico, Intermedio, Avanzado.');
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

    async deleteCourse(courseId) {
        await this.getCourseById(courseId);

        const deactivatedCourse = await this.courseRepository.updateById(courseId, {
            isVisible: false,
            status: 'INACTIVO',
            updatedAt: new Date()
        });

        logger.info(`Curso ID: ${courseId} desactivado logicamente del catalogo.`);
        return deactivatedCourse;
    }

    /**
     * Obtiene la estructura de nodos y aristas a partir de Qdrant (RF 05 y Grafo)
     * Resiliente a caidas de base de datos vectorial para no tumbar la API
     */
    async getCourseGraph() {
        try {
            const qdrantUrl = (environment.qdrantUrl || 'http://localhost:6333').replace(/\/$/, '');
            
            let points = [];
            
            try {
                // Intento de obtener datos vectoriales con limite de tiempo
                const response = await axios.post(`${qdrantUrl}/collections/courses/points/scroll`, {
                    limit: 100,
                    with_payload: true,
                    with_vector: false
                }, { timeout: 3000 });
                
                points = response.data?.result?.points || [];
            } catch (qdrantError) {
                logger.warn(`[Qdrant Graph]: No se pudo conectar a Qdrant en ${qdrantUrl}. Retornando grafo sin documentos vectoriales.`);
            }

            const nodes = [];
            const edges = [];
            const categoriesSeen = new Set();

            points.forEach((point) => {
                const course = point.payload || {};
                const category = course.category || 'General';
                const catNodeId = `cat_${category.toLowerCase().replace(/\s+/g, '_')}`;

                if (!categoriesSeen.has(category)) {
                    categoriesSeen.add(category);
                    nodes.push({
                        id: catNodeId,
                        label: category,
                        type: 'category',
                        group: category,
                        size: 25
                    });
                }

                const courseNodeId = `course_${course.courseId || point.id}`;
                nodes.push({
                    id: courseNodeId,
                    label: course.title || 'Curso Indexado',
                    level: course.level || 'INTERMEDIO',
                    durationHours: course.durationHours || 20,
                    type: 'course',
                    group: category,
                    size: 15
                });

                edges.push({
                    id: `edge_${catNodeId}_${courseNodeId}`,
                    source: catNodeId,
                    target: courseNodeId,
                    relationship: 'CONTIENE'
                });
            });

            return {
                nodes,
                edges,
                summary: {
                    totalNodes: nodes.length,
                    totalEdges: edges.length,
                    totalCategories: categoriesSeen.size,
                    totalCourses: points.length
                }
            };
        } catch (error) {
            logger.error('[CourseService]: Fallo critico armando el grafo de conocimiento:', error.message);
            throw new AppError('Error interno construyendo el grafo de conocimiento.', 500);
        }
    }
}