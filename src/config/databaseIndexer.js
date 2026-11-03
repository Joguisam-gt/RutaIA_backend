// Principio SRP (Single Responsibility Principle): Encapsula la inicialización de colecciones, validadores JSON Schema e índices en MongoDB.
import { createRequire } from 'module';
import { database } from './database.js';
import logger from '../utils/logger.js';

// Inicializa 'require' dentro del contexto de Módulos ES para la carga limpia de archivos JSON
const require = createRequire(import.meta.url);

// Carga estática de los esquemas JSON de validación
const userSchema = require('../schemas/user.schema.json');
const courseSchema = require('../schemas/course.schema.json');
const querySchema = require('../schemas/query.schema.json');
const ratingSchema = require('../schemas/rating.schema.json');
const notificationSchema = require('../schemas/notification.schema.json');

/**
 * Normaliza y extrae el objeto $jsonSchema para evitar anidamientos duplicados.
 * @param {Object} rawSchema - Esquema cargado directamente del archivo JSON.
 * @returns {Object|null} Objeto validador listo para MongoDB.
 */
function buildMongoValidator(rawSchema) {
    if (!rawSchema) return null;

    if (rawSchema.$jsonSchema) {
        return { $jsonSchema: rawSchema.$jsonSchema };
    }

    if (rawSchema.validator && rawSchema.validator.$jsonSchema) {
        return { $jsonSchema: rawSchema.validator.$jsonSchema };
    }

    return { $jsonSchema: rawSchema };
}

/**
 * Inicializa y valida las colecciones e índices en la base de datos nativa de MongoDB.
 * @returns {Promise<void>}
 */
export async function initializeDatabaseIndexes() {
    try {
        const db = database.getDb();
        const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);

        // Mapeo de colecciones y sus esquemas JSON correspondientes
        const collectionsToCreate = [
            { name: 'users', schema: userSchema },
            { name: 'courses', schema: courseSchema },
            { name: 'queries', schema: querySchema },
            { name: 'ratings', schema: ratingSchema },
            { name: 'notifications', schema: notificationSchema },
            { name: 'metrics', schema: null }
        ];

        // Creación de colecciones con validadores nativos normalizados
        for (const col of collectionsToCreate) {
            if (!existingCollections.includes(col.name)) {
                const validatorObj = buildMongoValidator(col.schema);
                const options = validatorObj ? { validator: validatorObj } : {};

                await db.createCollection(col.name, options);
                logger.info(`Colección '${col.name}' creada con validador JSON Schema.`);
            }
        }

        // Creación de índices compuestos y únicos para optimización de consultas
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });

        await db.collection('courses').createIndex({ category: 1, status: 1 });
        await db.collection('courses').createIndex({ instructorId: 1 });

        await db.collection('queries').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('queries').createIndex({ status: 1 });

        await db.collection('ratings').createIndex({ queryId: 1 });
        await db.collection('notifications').createIndex({ userId: 1, read: 1 });

        logger.info('Índices y esquemas de MongoDB sincronizados correctamente.');
    } catch (error) {
        logger.error('Error inicializando índices y esquemas en MongoDB:', error);
        throw error;
    }
}

// Alias de función requeridos por server.js y controllers
export const applyIndexes = initializeDatabaseIndexes;
export const applyJsonSchemas = initializeDatabaseIndexes;

// Asignación de métodos a las propiedades del objeto/función para llamadas estáticas dinámicas
initializeDatabaseIndexes.applyIndexes = initializeDatabaseIndexes;
initializeDatabaseIndexes.applyJsonSchemas = initializeDatabaseIndexes;
initializeDatabaseIndexes.initializeDatabaseIndexes = initializeDatabaseIndexes;

export const DatabaseIndexer = initializeDatabaseIndexes;
export default initializeDatabaseIndexes;