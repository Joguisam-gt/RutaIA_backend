import BaseRepository from './base.repository.js';

/**
 * Repositorio encargado de la persistencia y consultas de usuarios/estudiantes.
 */
export class StudentRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email: email.toLowerCase().trim() });
    }

    async findAllStudents(limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ role: 'student' })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Cuenta el total de estudiantes por su rol en la plataforma.
     * Rol a filtrar (ej. 'student').
     */
    async countByRole(role = 'student') {
        return await this.collection.countDocuments({ role });
    }
}

const studentRepositoryInstance = new StudentRepository();
export default studentRepositoryInstance;