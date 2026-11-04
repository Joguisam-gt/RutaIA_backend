// src/repositories/base.repository.js
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';

/**
 * Repositorio base orientado a objetos con operaciones CRUD estándar (SRP & OCP).
 */
export default class BaseRepository {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    get collection() {
        return Database.getDb().collection(this.collectionName);
    }

    /**
     * Convierte de forma segura un string a ObjectId si es válido.
     * @protected
     */
    _toObjectId(id) {
        if (!id) return null;
        if (id instanceof ObjectId) return id;
        return ObjectId.isValid(id) ? new ObjectId(id) : id;
    }

    /**
     * Inserta un documento con marcas de tiempo.
     */
    async create(data, options = {}) {
        const now = new Date();
        const document = {
            ...data,
            createdAt: data.createdAt || now,
            updatedAt: data.updatedAt || now
        };
        const result = await this.collection.insertOne(document, options);
        return { _id: result.insertedId, ...document };
    }

    /**
     * Busca un documento por su ID.
     */
    async findById(id, options = {}) {
        const queryId = this._toObjectId(id);
        return await this.collection.findOne({ _id: queryId }, options);
    }

    /**
     * Busca un documento según un filtro.
     */
    async findOne(filter, options = {}) {
        return await this.collection.findOne(filter, options);
    }

    /**
     * Consulta con paginación y filtros dinámicos (Utilizado para el Catálogo RF 04).
     */
    async findWithPagination(filter = {}, limit = 50, page = 1, sort = { createdAt: -1 }) {
        const safeLimit = Math.max(1, Number(limit) || 50);
        const safePage = Math.max(1, Number(page) || 1);
        const skip = (safePage - 1) * safeLimit;

        return await this.collection
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(safeLimit)
            .toArray();
    }

    /**
     * Actualiza un documento por ID.
     */
    async updateById(id, updateData, options = {}) {
        const queryId = this._toObjectId(id);
        const result = await this.collection.findOneAndUpdate(
            { _id: queryId },
            { $set: { ...updateData, updatedAt: new Date() } },
            { returnDocument: 'after', ...options }
        );
        return result?.value || result;
    }

    /**
     * Alias compatible para update()
     */
    async update(id, updateData, options = {}) {
        return this.updateById(id, updateData, options);
    }

    /**
     * Elimina físicamente un documento por su ID.
     */
    async deleteById(id, options = {}) {
        const queryId = this._toObjectId(id);
        const result = await this.collection.deleteOne({ _id: queryId }, options);
        return result.deletedCount > 0;
    }
}