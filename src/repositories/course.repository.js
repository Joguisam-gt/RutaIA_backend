import BaseRepository from './base.repository.js';

/**
 * Repositorio encargado del acceso a datos de la colección de cursos.
 */
export class CourseRepository extends BaseRepository {
    constructor() {
        super('courses');
    }

    async findByCategory(category, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ category, status: 'ACTIVO' })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Cuenta el total de cursos filtrados por su estado.
     * Estado del curso (ej. 'ACTIVO').
     */
    async countByStatus(status = 'ACTIVO') {
        return await this.collection.countDocuments({ status });
    }
}

const courseRepositoryInstance = new CourseRepository();
export default courseRepositoryInstance;