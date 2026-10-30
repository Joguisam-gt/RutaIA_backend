import Database from './database.js';
import logger from '../utils/logger.js';

/**
 * Clase responsable de la creación e imposición de índices optimizados en MongoDB (SRP).
 */
export default class DatabaseIndexer {
    /**
     * Aplica la estrategia completa de índices a todas las colecciones de la plataforma.
     */
    static async applyIndexes() {
        try {
            const db = Database.getDb();

            // 1. Colección 'users'
            const users = db.collection('users');
            await users.createIndex({ email: 1 }, { unique: true, name: 'idx_users_email_unique' });
            await users.createIndex({ role: 1, createdAt: -1 }, { name: 'idx_users_role_createdAt' });

            // 2. Colección 'courses'
            const courses = db.collection('courses');
            await courses.createIndex({ status: 1, category: 1 }, { name: 'idx_courses_status_category' });
            await courses.createIndex({ title: 'text', description: 'text' }, { name: 'idx_courses_text_search' });
            await courses.createIndex({ averageRating: -1, totalRatings: -1 }, { name: 'idx_courses_ratings_rank' });

            // 3. Colección 'queries' (Optimizada para documentos desnormalizados)
            const queries = db.collection('queries');
            await queries.createIndex({ studentId: 1, createdAt: -1 }, { name: 'idx_queries_student_history' });
            await queries.createIndex({ status: 1, createdAt: -1 }, { name: 'idx_queries_status_metrics' });
            await queries.createIndex({ 'recommendedCourses.courseId': 1 }, { name: 'idx_queries_recommended_course' });

            // 4. Colección 'ratings' (Prevención de duplicados + Consultas rápidas)
            const ratings = db.collection('ratings');
            await ratings.createIndex(
                { courseId: 1, studentId: 1 },
                { unique: true, name: 'idx_ratings_course_student_unique' }
            );
            await ratings.createIndex({ courseId: 1, score: -1 }, { name: 'idx_ratings_course_score' });
            await ratings.createIndex({ studentId: 1, createdAt: -1 }, { name: 'idx_ratings_student_history' });

            logger.info('Estrategia de índices NoSQL aplicada exitosamente en todas las colecciones.');
        } catch (error) {
            logger.error('Error al aplicar los índices en la base de datos:', error.message);
            throw error;
        }
    }
}