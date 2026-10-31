import BaseRepository from './base.repository.js';

/**
 * Repositorio encargado de la persistencia de calificaciones de los cursos.
 */
export class RatingRepository extends BaseRepository {
    constructor() {
        super('ratings');
    }

    async findByCourseId(courseId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ courseId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Calcula la calificación promedio global de toda la plataforma mediante un pipeline de agregación.
     * @returns {Promise<number>}
     */
    async getGlobalAverageRating() {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: '$score' }
                }
            }
        ];

        const result = await this.collection.aggregate(pipeline).toArray();
        return result.length > 0 ? Number(result[0].avgScore.toFixed(2)) : 0;
    }
}

const ratingRepositoryInstance = new RatingRepository();
export default ratingRepositoryInstance;