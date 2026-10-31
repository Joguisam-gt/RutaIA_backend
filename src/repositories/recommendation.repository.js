// src/repositories/recommendation.repository.js
import { ObjectId } from 'mongodb';
import BaseRepository from './base.repository.js';

export class RecommendationRepository extends BaseRepository {
    constructor() {
        super('categories_graph');
    }

    /**
     * Obtiene la estructura completa del Grafo jerárquico (Nodos principales y Subnodos)
     */
    async getFullGraph() {
        return await this.collection.aggregate([
            {
                $graphLookup: {
                    from: 'categories_graph',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'subnodes'
                }
            },
            {
                $match: { parentId: null } // Traemos solo los nodos raíz
            }
        ]).toArray();
    }

    /**
     * Asocia un curso a un nodo específico del grafo
     */
    async linkCourseToNode(nodeId, courseId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(nodeId) },
            { $addToSet: { courseIds: new ObjectId(courseId) } }
        );
    }
}

export default new RecommendationRepository();