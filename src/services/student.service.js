// src/services/student.service.js
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';
import NotFoundErrorImport from '../errors/notFoundError.js';
import AppErrorImport from '../errors/appError.js';

const NotFoundError = NotFoundErrorImport?.NotFoundError || NotFoundErrorImport || AppErrorImport;

export default class StudentService {
    /**
     * Helper seguro para convertir a ObjectId
     * @private
     */
    _toObjectId(id) {
        if (!id) return null;
        if (id instanceof ObjectId) return id;
        return ObjectId.isValid(id) ? new ObjectId(id) : id;
    }

    /**
     * 1. Consulta un estudiante por su ID (RF 02)
     * Responde con 404 si no existe
     */
    async getStudentById(studentId) {
        const db = Database.getDb();
        const queryId = this._toObjectId(studentId);

        const user = await db.collection('users').findOne(
            { _id: queryId },
            { projection: { password: 0 } } // Excluir contraseña por seguridad
        );

        if (!user) {
            throw new NotFoundError('El estudiante solicitado no existe.');
        }

        return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            level: user.level || 'Principiante',
            areaOfInterest: user.areaOfInterest || user.interestArea || 'General',
            role: user.role || 'student',
            createdAt: user.createdAt
        };
    }

    /**
     * 2. Lista todos los estudiantes registrados (RF 02)
     */
    async getAllStudents(limit = 50, page = 1) {
        const db = Database.getDb();
        const safeLimit = Math.max(1, Number(limit) || 50);
        const safePage = Math.max(1, Number(page) || 1);
        const skip = (safePage - 1) * safeLimit;

        const students = await db.collection('users')
            .find(
                { role: { $ne: 'admin' } }, // Solo estudiantes, excluyendo admins
                { projection: { password: 0 } }
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .toArray();

        return students.map(s => ({
            id: String(s._id),
            name: s.name,
            email: s.email,
            level: s.level || 'Principiante',
            areaOfInterest: s.areaOfInterest || 'General',
            createdAt: s.createdAt
        }));
    }

    /**
     * 3. Consulta el historial de recomendaciones de un estudiante (RF 02 y RF 16)
     */
    async getStudentHistory(studentId) {
        // Valida primero que el estudiante exista (o lanza 404)
        await this.getStudentById(studentId);

        const db = Database.getDb();
        const history = await db.collection('queries')
            .find({ studentId: String(studentId) })
            .sort({ createdAt: -1 })
            .toArray();

        return history.map(q => ({
            queryId: String(q._id),
            question: q.question,
            status: q.status,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt
        }));
    }

    // ==========================================
    // MÉTODOS COMPLEMENTARIOS (Compatibilidad UI)
    // ==========================================
    async getMyCourses(studentId) {
        const db = Database.getDb();
        const sId = this._toObjectId(studentId);
        const enrollments = await db.collection('enrollments').find({ studentId: sId }).toArray();
        if (!enrollments.length) return [];

        const courseIds = enrollments.map(e => e.courseId);
        const courses = await db.collection('courses').find({ _id: { $in: courseIds } }).toArray();

        return courses.map(c => ({
            id: String(c._id),
            title: c.title,
            category: c.category,
            durationHours: c.durationHours
        }));
    }

    async getCertificates(studentId) {
        return [];
    }

    async getWishlist(studentId) {
        return [];
    }
}