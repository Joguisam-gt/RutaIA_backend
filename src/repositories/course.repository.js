// src/repositories/course.repository.js
import { ObjectId } from 'mongodb';
import BaseRepository from './base.repository.js';

export class CourseRepository extends BaseRepository {
    constructor() {
        super('courses');
    }

    /**
     * Obtiene la lista de cursos visibles para el estudiante con su calificación promedio calculada vía Aggregation Pipeline
     */
    async findVisibleWithRatings(filters = {}) {
        const matchStage = {
            isVisible: true,
            status: 'PROCESADO',
            ...filters
        };

        return await this.collection.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'ratingsList'
                }
            },
            {
                $addFields: {
                    averageRating: { $ifNull: [{ $avg: '$ratingsList.stars' }, 0] },
                    totalRatings: { $size: '$ratingsList' }
                }
            },
            {
                $project: {
                    ratingsList: 0 
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();
    }

    /**
     * Cambia el estado de visibilidad del curso (Acción exclusiva del Administrador)
     */
    async updateVisibility(courseId, isVisible) {
        return await this.updateById(courseId, { isVisible });
    }

    /**
     * Cambia el estado de procesamiento del PDF (PENDIENTE -> PROCESADO -> ERROR)
     */
    async updateStatus(courseId, status) {
        return await this.updateById(courseId, { status });
    }
}

export default new CourseRepository();