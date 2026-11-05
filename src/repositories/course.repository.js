// src/repositories/course.repository.js
import BaseRepository from './base.repository.js';

/**
 * Repositorio encargado del acceso a datos de la colección de cursos (RF 03 y RF 04).
 */
export class CourseRepository extends BaseRepository {
    constructor() {
        super('courses');
    }

    /**
     * Obtiene cursos activos filtrados por categoría (RF 04).
     */
    async findByCategory(category, limit = 20, page = 1) {
        return await this.findWithPagination(
            { category, status: 'ACTIVO', isVisible: true },
            limit,
            page
        );
    }

    /**
     * Cuenta el total de cursos filtrados por su estado.
     */
    async countByStatus(status = 'ACTIVO') {
        return await this.collection.countDocuments({ status });
    }
}

// Instancia única (Singleton)
const courseRepositoryInstance = new CourseRepository();
export default courseRepositoryInstance;