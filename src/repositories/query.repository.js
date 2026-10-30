import BaseRepository from './base.repository.js';

/**
 * Repositorio encargado de gestionar el almacenamiento e historial de consultas a la IA.
 */
export class QueryRepository extends BaseRepository {
    constructor() {
        super('queries');
    }

    async findByStudentId(studentId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ studentId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Cuenta el total de consultas realizadas a la IA.
     * @returns {Promise<number>}
     */
    async countTotalQueries() {
        return await this.collection.countDocuments({});
    }

    /**
     * Ejecuta la agregación para desglosar interacciones por estado (PENDIENTE, RESPONDIDA, etc.).
     * @returns {Promise<Array<{_id: string, count: number}>>}
     */
    async getStatusBreakdown() {
        const pipeline = [
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ];
        return await this.collection.aggregate(pipeline).toArray();
    }

    /**
     * Obtiene los cursos más recomendados por la IA en sus respuestas RAG.
     * @param {number} limit - Cantidad máxima de cursos recomendados a retornar.
     * @returns {Promise<Array>}
     */
    async getTopRecommendedCourses(limit = 5) {
        const pipeline = [
            { $unwind: '$recommendedCourseIds' },
            {
                $group: {
                    _id: '$recommendedCourseIds',
                    totalRecommendations: { $sum: 1 }
                }
            },
            { $sort: { totalRecommendations: -1 } },
            { $limit: limit },
            {
                $addFields: {
                    courseObjectId: {
                        $cond: {
                            if: { $regexMatch: { input: '$_id', regex: /^[0-9a-fA-F]{24}$/ } },
                            then: { $toObjectId: '$_id' },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseObjectId',
                    foreignField: '_id',
                    as: 'courseDetails'
                }
            },
            { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    courseId: '$_id',
                    title: { $ifNull: ['$courseDetails.title', 'Curso Genérico'] },
                    category: { $ifNull: ['$courseDetails.category', 'General'] },
                    totalRecommendations: 1,
                    averageRating: { $ifNull: ['$courseDetails.averageRating', 0] }
                }
            }
        ];

        return await this.collection.aggregate(pipeline).toArray();
    }
}

const queryRepositoryInstance = new QueryRepository();
export default queryRepositoryInstance;