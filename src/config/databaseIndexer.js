import { database } from './database.js';
import { logger } from '../utils/logger.js';

// Importación de esquemas JSON de validación
import userSchema from '../schemas/user.schema.json' assert { type: 'json' };
import courseSchema from '../schemas/course.schema.json' assert { type: 'json' };
import querySchema from '../schemas/query.schema.json' assert { type: 'json' };
import ratingSchema from '../schemas/rating.schema.json' assert { type: 'json' };
import notificationSchema from '../schemas/notification.schema.json' assert { type: 'json' };

/**
 * Inicializa y valida las colecciones e índices en la base de datos nativa de MongoDB.
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

        // Creación de colecciones con validadores nativos si no existen
        for (const col of collectionsToCreate) {
            if (!existingCollections.includes(col.name)) {
                const options = col.schema ? { validator: { $jsonSchema: col.schema } } : {};
                await db.createCollection(col.name, options);
                logger.info(`Colección '${col.name}' creada con validador JSON Schema.`);
            }
        }

        // Definición e índices de rendimiento
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