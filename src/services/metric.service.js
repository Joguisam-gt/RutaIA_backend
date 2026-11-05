// src/services/metric.service.js
import Database from '../config/database.js';
import { queryStatus } from '../constants/queryStatus.js';

export default class MetricService {
    /**
     * Obtiene las métricas globales de la plataforma RAG (RF 18)
     */
    async getPlatformStats() {
        const db = Database.getDb();

        // 1. Métricas de Consultas (RF 18)
        const queriesCollection = db.collection('queries');
        const totalQueries = await queriesCollection.countDocuments();
        const answeredQueries = await queriesCollection.countDocuments({ status: queryStatus.ANSWERED });
        const noResultsQueries = await queriesCollection.countDocuments({ status: queryStatus.NO_RESULTS });
        const errorQueries = await queriesCollection.countDocuments({ status: queryStatus.ERROR });

        // 2. Promedio general de Calificaciones (RF 18)
        const ratingsCollection = db.collection('ratings');
        const ratingStats = await ratingsCollection.aggregate([
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$score' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]).toArray();

        const averageRating = ratingStats.length > 0 && ratingStats[0].averageRating
            ? Number(ratingStats[0].averageRating.toFixed(2))
            : 0;

        // 3. Curso más recomendado a partir de las fuentes RAG (RF 18)
        const recommendationsCollection = db.collection('recommendations');
        const mostRecommendedAggregation = await recommendationsCollection.aggregate([
            // Descomponer el arreglo de fuentes de cada recomendación
            { $unwind: '$sources' },
            // Agrupar por el ID o título del curso
            {
                $group: {
                    _id: '$sources.courseId',
                    courseTitle: { $first: '$sources.title' },
                    recommendationCount: { $sum: 1 }
                }
            },
            // Ordenar de mayor a menor
            { $sort: { recommendationCount: -1 } },
            // Tomar el primer lugar
            { $limit: 1 }
        ]).toArray();

        const mostRecommendedCourse = mostRecommendedAggregation.length > 0
            ? {
                courseId: String(mostRecommendedAggregation[0]._id || ''),
                title: mostRecommendedAggregation[0].courseTitle || 'Sin título',
                count: mostRecommendedAggregation[0].recommendationCount
            }
            : {
                courseId: null,
                title: 'No hay cursos recomendados aún',
                count: 0
            };

        // Retornamos el contrato estricto del RF 18
        return {
            totalQueries,
            answeredQueries,
            noResultsQueries,
            errorQueries,
            averageRating,
            totalRatings: ratingStats[0]?.totalRatings || 0,
            mostRecommendedCourse
        };
    }

    /**
     * Mantiene compatibilidad para métricas individuales del estudiante
     */
    async getMetricsByStudent(studentId) {
        const db = Database.getDb();
        const queriesCount = await db.collection('queries').countDocuments({ studentId: String(studentId) });
        const ratingsCount = await db.collection('ratings').countDocuments({ studentId: String(studentId) });

        return {
            studentId,
            totalQueriesAsked: queriesCount,
            totalRatingsGiven: ratingsCount
        };
    }
}