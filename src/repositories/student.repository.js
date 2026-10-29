import BaseRepository from './base.repository.js';

export class StudentRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email: email.toLowerCase().trim() });
    }

    async updateRole(userId, newRole) {
        return await this.updateById(userId, { role: newRole });
    }

    async findAllStudents(limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ role: 'student' }, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }
}

export default new StudentRepository();