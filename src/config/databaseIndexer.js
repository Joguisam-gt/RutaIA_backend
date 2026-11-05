// src/config/databaseIndexer.js
import { createRequire } from 'module';
import { database } from './database.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);

// Carga opcional de esquemas JSON si existen
let userSchema = null, courseSchema = null, querySchema = null, ratingSchema = null;
try {
    userSchema = require('../schemas/user.schema.json');
    courseSchema = require('../schemas/course.schema.json');
    querySchema = require('../schemas/query.schema.json');
    ratingSchema = require('../schemas/rating.schema.json');
} catch (e) {
    logger.warn('Aviso: Algunos esquemas JSON no fueron encontrados. Se crearán colecciones estándar.');
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

        // Las 6 colecciones oficiales exigidas por la especificación
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
                logger.info(`Colección '${col.name}' creada exitosamente.`);
            }
        }

        // ==========================================
        // ÍNDICES ESTRATÉGICOS JUSTIFICADOS
        // ==========================================
        // 1. Usuarios: Correo único (Regla de negocio RF 01)
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });

        // 2. Cursos: Filtrado rápido por categoría, nivel y estado (RF 04)
        await db.collection('courses').createIndex({ status: 1, isVisible: 1, category: 1, level: 1 });

        // 3. Consultas: Historial por estudiante ordenado por fecha (RF 02 y RF 07)
        await db.collection('queries').createIndex({ studentId: 1, createdAt: -1 });
        await db.collection('queries').createIndex({ status: 1 });

        // 4. Recomendaciones: Búsqueda rápida por consulta
        await db.collection('recommendations').createIndex({ queryId: 1 });
        await db.collection('recommendations').createIndex({ studentId: 1 });

        // 5. Calificaciones: Una sola calificación por recomendación (Regla RF 17)
        await db.collection('ratings').createIndex(
            { recommendationId: 1 }, 
            { unique: true, sparse: true }
        );

        logger.info('Índices y esquemas de MongoDB sincronizados correctamente.');
    } catch (error) {
        logger.error('Error inicializando índices y esquemas en MongoDB:', error);
        throw error;
    }
}

export const applyIndexes = initializeDatabaseIndexes;
export const applyJsonSchemas = initializeDatabaseIndexes;
export default initializeDatabaseIndexes;