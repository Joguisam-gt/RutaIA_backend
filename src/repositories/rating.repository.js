// src/repositories/rating.repository.js
import { ObjectId } from 'mongodb';
import BaseRepository from './base.repository.js';

/**
 * Repositorio orientado a objetos para la gestión de la colección 'ratings' en MongoDB (SRP & DIP).
 * Proporciona consultas específicas para verificar calificaciones únicas y calcular promedios.
 */
export class RatingRepository extends BaseRepository {
    constructor() {
        super('ratings');
    }

    /**
     * Busca la calificación realizada por un estudiante específico a un curso.
     * ID del estudiante.
     * ID del curso.
     * Documento de la calificación o null si no existe.
     */
    async findByStudentAndCourse(studentId, courseId) {
        return await this.collection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId)
        });
    }

    /**
     * Obtiene la lista paginada de calificaciones de un curso.
     * ID del curso.
     * Límite de registros por página.
     * Número de página.
     */
    async findByCourseId(courseId, limit = 10, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ courseId: new ObjectId(courseId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Ejecuta un pipeline de agregación para obtener el promedio de estrellas y total de votos de un curso.
     *  ID del curso.
     */
    async getCourseStats(courseId) {
        const pipeline = [
            {
                $match: { courseId: new ObjectId(courseId) }
            },
            {
                $group: {
                    _id: '$courseId',
                    averageScore: { $avg: '$score' },
                    totalRatings: { $sum: 1 }
                }
            }
        ];

        const result = await this.collection.aggregate(pipeline).toArray();

        if (result.length === 0) {
            return { averageScore: 0, totalRatings: 0 };
        }

        return {
            averageScore: Number(result[0].averageScore.toFixed(2)),
            totalRatings: result[0].totalRatings
        };
    }
}

export default new RatingRepository();