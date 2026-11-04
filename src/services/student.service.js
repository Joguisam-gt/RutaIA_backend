// src/services/student.service.js
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';

export default class StudentService {
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