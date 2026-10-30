import Database from '../config/database.js';

/**
 * Repositorio base abstracto con soporte para transacciones ACID y ClientSession (OCP & DIP).
 */
export default class BaseRepository {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    get collection() {
        return Database.getDb().collection(this.collectionName);
    }

    /**
     * Inserta un documento con soporte para sesión transaccional.
     */
    async create(data, options = {}) {
        const document = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await this.collection.insertOne(document, options);
        return { _id: result.insertedId, ...document };
    }

    /**
     * Busca un documento por filtro con soporte para sesión transaccional.
     */
    async findOne(filter, options = {}) {
        return await this.collection.findOne(filter, options);
    }

    /**
     * Actualiza un documento con soporte para sesión transaccional.
     */
    async update(id, updateData, options = {}) {
        const result = await this.collection.findOneAndUpdate(
            { _id: id },
            { $set: { ...updateData, updatedAt: new Date() } },
            { returnDocument: 'after', ...options }
        );
        return result;
    }
}