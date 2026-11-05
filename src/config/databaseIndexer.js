// src/config/databaseIndexer.js
import { createRequire } from 'module';
import { database } from './database.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);

let userSchema = null, courseSchema = null, querySchema = null, ratingSchema = null;
try {
    userSchema = require('../schemas/user.schema.json');
    courseSchema = require('../schemas/course.schema.json');
    querySchema = require('../schemas/query.schema.json');
    ratingSchema = require('../schemas/rating.schema.json');
} catch (e) {
    logger.warn('[DatabaseIndexer]: Algunos esquemas JSON no fueron encontrados. Se crearan colecciones estandar.');
}

function buildMongoValidator(rawSchema) {
    if (!rawSchema) return null;
    if (rawSchema.$jsonSchema) return { $jsonSchema: rawSchema.$jsonSchema };
    if (rawSchema.validator?.$jsonSchema) return { $jsonSchema: rawSchema.validator.$jsonSchema };
    return { $jsonSchema: rawSchema };
}

export async function initializeDatabaseIndexes() {
    try {
        const db = database.getDb();
        const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);

        const collectionsToCreate = [
            { name: 'users', schema: userSchema },
            { name: 'courses', schema: courseSchema },
            { name: 'queries', schema: querySchema },
            { name: 'recommendations', schema: null },
            { name: 'ratings', schema: ratingSchema },
            { name: 'metrics', schema: null }
        ];

        for (const col of collectionsToCreate) {
            if (!existingCollections.includes(col.name)) {
                const validatorObj = buildMongoValidator(col.schema);
                const options = validatorObj ? { validator: validatorObj } : {};
                await db.createCollection(col.name, options);
                logger.info(`[DatabaseIndexer]: Coleccion '${col.name}' creada exitosamente.`);
            }
        }

        // Indices
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });

        await db.collection('courses').createIndex({ status: 1, isVisible: 1, category: 1, level: 1 });

        await db.collection('queries').createIndex({ studentId: 1, createdAt: -1 });
        await db.collection('queries').createIndex({ status: 1 });

        await db.collection('recommendations').createIndex({ queryId: 1 });
        await db.collection('recommendations').createIndex({ studentId: 1 });

        await db.collection('ratings').createIndex({ recommendationId: 1 }, { unique: true, sparse: true });

        logger.info('Indices y esquemas de MongoDB sincronizados correctamente.');
    } catch (error) {
        logger.error('Error inicializando indices y esquemas en MongoDB:', error);
        throw error;
    }
}

// Clase estatica para compatibilidad total con server.js
export class DatabaseIndexer {
    static async applyIndexes() {
        return await initializeDatabaseIndexes();
    }
    static async applyJsonSchemas() {
        return await initializeDatabaseIndexes();
    }
    static async initializeDatabaseIndexes() {
        return await initializeDatabaseIndexes();
    }
}

// Asignacion en la funcion para compatibilidad si se importa como funcion
initializeDatabaseIndexes.applyIndexes = initializeDatabaseIndexes;
initializeDatabaseIndexes.applyJsonSchemas = initializeDatabaseIndexes;
initializeDatabaseIndexes.initializeDatabaseIndexes = initializeDatabaseIndexes;

export const applyIndexes = initializeDatabaseIndexes;
export const applyJsonSchemas = initializeDatabaseIndexes;

export default DatabaseIndexer;