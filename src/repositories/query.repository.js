// src/repositories/query.repository.js
import { ObjectId } from 'mongodb';
import BaseRepository from './base.repository.js';

export class QueryRepository extends BaseRepository {
    constructor() {
        super('queries');
    }

    /**
     * Obtiene el historial de interacciones de un usuario específico de forma paginada
     */
    async findByStudentId(studentId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ studentId: new ObjectId(studentId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Agregación para el Administrador: Métricas globales de interacciones y recomendaciones
     */
    async getMetricsSummary() {
        return await this.collection.aggregate([
            {
                $facet: {
                    totalQueries: [{ $count: 'count' }],
                    queriesByStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    averageRecommendationsPerQuery: [
                        { $project: { recCount: { $size: { $ifNull: ['$recommendedCourseIds', []] } } } },
                        { $group: { _id: null, avgRecommended: { $avg: '$recCount' } } }
                    ]
                }
            }
        ]).toArray();
    }
}

export default new QueryRepository();