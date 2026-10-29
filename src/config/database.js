import { MongoClient } from 'mongodb';
import { MONGODB_URI, MONGODB_DB_NAME } from './environment.js';
import logger from '../utils/logger.js';

export default class Database {
    static instance = null;
    static client = null;

    static async connect() {
        if (this.instance) {
            return this.instance;
        }

        try {
            this.client = new MongoClient(MONGODB_URI, {
                maxPoolSize: 50,
                minPoolSize: 10,
                maxIdleTimeMS: 30000,
                serverSelectionTimeoutMS: 5000,
            });

            await this.client.connect();
            this.instance = this.client.db(MONGODB_DB_NAME);
            logger.info('Conexión a MongoDB establecida exitosamente (Singleton Pool - ESM)');

            await this.createIndexes(this.instance);

            return this.instance;
        } catch (error) {
            logger.error('Error al conectar con MongoDB:', error);
            throw error;
        }
    }

    static getDb() {
        if (!this.instance) {
            throw new Error('La base de datos no ha sido inicializada. Ejecute Database.connect() primero.');
        }
        return this.instance;
    }

    static getClient() {
        return this.client;
    }

    static async close() {
        if (this.client) {
            await this.client.close();
            this.instance = null;
            this.client = null;
            logger.info('Conexión a MongoDB cerrada.');
        }
    }

    static async createIndexes(db) {
        await db.collection('courses').createIndexes([
            { key: { isVisible: 1, status: 1 }, name: 'idx_courses_visibility_status' },
            { key: { category: 1, level: 1 }, name: 'idx_courses_category_level' },
            { key: { graphNodeId: 1 }, name: 'idx_courses_graph_node' }
        ]);

        await db.collection('queries').createIndexes([
            { key: { studentId: 1, createdAt: -1 }, name: 'idx_queries_student_history' },
            { key: { status: 1, createdAt: -1 }, name: 'idx_queries_status_date' }
        ]);

        await db.collection('ratings').createIndexes([
            { key: { courseId: 1, studentId: 1 }, unique: true, name: 'idx_unique_student_course_rating' },
            { key: { courseId: 1 }, name: 'idx_ratings_course' }
        ]);

        await db.collection('categories_graph').createIndexes([
            { key: { parentId: 1 }, name: 'idx_graph_parent' }
        ]);

        logger.info('Índices de MongoDB verificados/creados correctamente.');
    }
}