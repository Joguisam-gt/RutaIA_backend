// src/repositories/rating.repository.js
import BaseRepository from './base.repository.js';

export class RatingRepository extends BaseRepository {
    constructor() {
        super('ratings');
    }

    /**
     * Calcula el promedio general de calificaciones de la plataforma (RF 18)
     */
    async getAverageScore() {
        const result = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    averageScore: { $avg: '$score' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]).toArray();

        return {
            averageScore: result[0]?.averageScore ? Number(result[0].averageScore.toFixed(2)) : 0,
            totalRatings: result[0]?.totalRatings || 0
        };
    }
}

export default new RatingRepository();