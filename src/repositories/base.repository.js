import { ObjectId } from 'mongodb';
import Database from '../config/database.js';

export default class BaseRepository {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    get collection() {
        return Database.getDb().collection(this.collectionName);
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async find(filter = {}, options = {}) {
        return await this.collection.find(filter, options).toArray();
    }

    async create(data) {
        const document = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await this.collection.insertOne(document);
        return { _id: result.insertedId, ...document };
    }

    async updateById(id, updateData) {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        return result;
    }

    async deleteById(id) {
        const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }
}