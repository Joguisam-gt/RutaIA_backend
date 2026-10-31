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
     */
    async countTotalQueries() {
        return await this.collection.countDocuments({});
    }

    /**
     * Ejecuta la agregación para desglosar interacciones por estado (PENDIENTE, RESPONDIDA, etc.).
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

    /**
     * Almacena la calificación y comentario del estudiante sobre la interacción con la IA.
     * ID de la interacción/pregunta.
     * ID del estudiante.
     * Objeto con score, comment y timestamp.
     */
    async addAIRating(queryId, studentId, ratingData) {
        return await this.collection.findOneAndUpdate(
            { _id: queryId, studentId },
            { 
                $set: { 
                    aiRating: {
                        score: ratingData.score,
                        comment: ratingData.comment,
                        createdAt: new Date()
                    },
                    updatedAt: new Date()
                } 
            },
            { returnDocument: 'after' }
        );
    }

    /**
     * Obtiene el listado de interacciones calificadas incluyendo la pregunta y respuesta (chat) para el Administrador.
     * Límite de registros.
     * Página actual.
     */
    async findAllAIRatingsWithChat(limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ aiRating: { $exists: true } })
            .project({
                _id: 1,
                studentId: 1,
                question: 1,
                answer: 1,
                recommendedCourses: 1,
                aiRating: 1,
                createdAt: 1
            })
            .sort({ 'aiRating.createdAt': -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }
}

const queryRepositoryInstance = new QueryRepository();
export default queryRepositoryInstance;