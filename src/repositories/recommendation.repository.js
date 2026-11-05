// src/repositories/recommendation.repository.js
import BaseRepository from './base.repository.js';

export class RecommendationRepository extends BaseRepository {
    constructor() {
        super('recommendations');
    }
}

export default new RecommendationRepository();