// Principio SRP (Single Responsibility Principle): Encapsula la creación e indexación de colecciones MongoDB con validación JSON Schema.
import { createRequire } from 'module';
import { database } from './database.js';
import { logger } from '../utils/logger.js';

// Inicializa 'require' dentro del contexto de Módulos ES para la carga limpia de archivos JSON de esquemas
const require = createRequire(import.meta.url);

// Carga estática de los esquemas JSON de validación
const userSchema = require('../schemas/user.schema.json');
const courseSchema = require('../schemas/course.schema.json');
const querySchema = require('../schemas/query.schema.json');
const ratingSchema = require('../schemas/rating.schema.json');
const notificationSchema = require('../schemas/notification.schema.json');

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

        // Creación de colecciones con validadores nativos si no existen previamente
        for (const col of collectionsToCreate) {
            if (!existingCollections.includes(col.name)) {
                const options = col.schema ? { validator: { $jsonSchema: col.schema } } : {};
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

// Vincula el método al objeto principal para soportar invocaciones por propiedad
initializeDatabaseIndexes.initializeDatabaseIndexes = initializeDatabaseIndexes;
initializeDatabaseIndexes.initialize = initializeDatabaseIndexes;

// Exportación nombrada de compatibilidad adicional
export const DatabaseIndexer = initializeDatabaseIndexes;

// Exportación por defecto requerida por src/server.js
export default initializeDatabaseIndexes;