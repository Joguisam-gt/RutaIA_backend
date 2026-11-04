import { ObjectId } from 'mongodb';
import Database from '../config/database.js';

export default class StudentService {
    // Método que faltaba para resolver tu error actual
    async getMyCourses(studentId) {
        const db = Database.getDb();
        const sId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;

        // Busca las inscripciones del estudiante o filtra en la colección de cursos
        const enrollments = await db.collection('enrollments').find({ studentId: sId }).toArray();
        if (!enrollments.length) return [];

        const courseIds = enrollments.map(e => e.courseId);
        const courses = await db.collection('courses').find({ _id: { $in: courseIds } }).toArray();

        return courses.map(c => ({
            id: String(c._id),
            title: c.title,
            category: c.category,
            durationHours: c.durationHours,
            thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500'
        }));
    }

    async getStudentMetrics(studentId) {
        const db = Database.getDb();
        const sId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;
        const totalCourses = await db.collection('enrollments').countDocuments({ studentId: sId });
        const certificatesCount = await db.collection('certificates').countDocuments({ studentId: sId });

        return {
            enrolledCourses: totalCourses,
            completedCertificates: certificatesCount
        };
    }

    async getStudentById(studentId) {
        const db = Database.getDb();
        const sId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;
        const user = await db.collection('users').findOne({ _id: sId });
        return user ? { id: String(user._id), name: user.name, email: user.email } : null;
    }

    async getCertificates(studentId) {
        const db = Database.getDb();
        const sId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;
        const certs = await db.collection('certificates').find({ studentId: sId }).toArray();
        const courseIds = certs.map(c => c.courseId);
        const courses = await db.collection('courses').find({ _id: { $in: courseIds } }).toArray();

        return certs.map(cert => {
            const course = courses.find(c => String(c._id) === String(cert.courseId));
            const credential = cert.credentialId || cert.uuid || `CERT-${String(cert._id).substring(0, 8).toUpperCase()}`;
            return {
                id: String(cert._id),
                uuid: credential,
                credentialId: credential,
                courseTitle: course?.title || 'Curso Certificado',
                title: course?.title || 'Curso Certificado',
                issueDate: cert.issueDate || new Date(),
                studentName: 'José Rodríguez'
            };
        });
    }

    async getWishlist(studentId) {
        const db = Database.getDb();
        const sId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;
        const wish = await db.collection('wishlists').findOne({ studentId: sId });
        if (!wish || !wish.courseIds?.length) return [];
        const courses = await db.collection('courses').find({ _id: { $in: wish.courseIds } }).toArray();
        return courses.map(c => ({
            id: String(c._id),
            title: c.title,
            category: c.category,
            durationHours: c.durationHours,
            thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500'
        }));
    }
}