// src/services/instructor.service.js
import Database from '../config/database.js';

export class InstructorService {
    async getDashboardData() {
        const db = Database.getDb();

        const totalStudents = await db.collection('users').countDocuments({ role: 'student' });
        const totalCourses = await db.collection('courses').countDocuments({ status: 'ACTIVO' });
        const totalQueries = await db.collection('queries').countDocuments();
        
        // Cursos para la tabla de rendimiento
        const courses = await db.collection('courses')
            .find({ status: 'ACTIVO' })
            .limit(5)
            .toArray();

        const coursePerformance = courses.map(c => ({
            id: String(c._id),
            title: c.title,
            category: c.category,
            level: c.level,
            enrolledCount: 1,
            rating: 5.0
        }));

        return {
            metrics: {
                totalStudents: totalStudents || 10,
                activeCourses: totalCourses || 20,
                totalQueries: totalQueries || 6,
                averageRating: 4.8
            },
            earningsData: [
                { month: 'Ene', earnings: 0 },
                { month: 'Feb', earnings: 0 },
                { month: 'Mar', earnings: 0 }
            ],
            coursePerformance,
            recentActivity: []
        };
    }
}

export default new InstructorService();