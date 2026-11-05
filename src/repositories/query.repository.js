// src/repositories/query.repository.js
import BaseRepository from './base.repository.js';

export class QueryRepository extends BaseRepository {
    constructor() {
        super('queries');
    }
}

export default new QueryRepository();