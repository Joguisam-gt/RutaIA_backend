import queryRepositoryInstance from '../repositories/query.repository.js';
import courseRepositoryInstance from '../repositories/course.repository.js';
import studentRepositoryInstance from '../repositories/student.repository.js';
import ratingRepositoryInstance from '../repositories/rating.repository.js';
import logger from '../utils/logger.js';

/**
 * Servicio orientado a objetos para el cálculo de métricas y estadísticas agregadas del sistema (SRP & DIP).
 * Ejecuta pipelines de agregación nativos en MongoDB para alimentar el panel del Administrador.
 */
export default class MetricService {
    /**
     * Inyección de dependencias a través del constructor.
     * Repositorio de consultas a la IA.
     * Repositorio de cursos.
     * Repositorio de usuarios/estudiantes.
     * Repositorio de calificaciones.
     */
    constructor(
        queryRepository = queryRepositoryInstance,
        courseRepository = courseRepositoryInstance,
        studentRepository = studentRepositoryInstance,
        ratingRepository = ratingRepositoryInstance
    ) {
        this.queryRepository = queryRepository;
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.ratingRepository = ratingRepository;
    }

    /**
     * Retorna el resumen consolidado para la pantalla principal del Dashboard del Administrador.
     * Totales globales de estudiantes, consultas, cursos y calificación promedio.
     */
    async getDashboardOverview() {
        try {
            const [totalStudents, totalQueries, totalCourses, overallRating] = await Promise.all([
                this.studentRepository.collection.countDocuments({ role: 'student' }),
                this.queryRepository.collection.countDocuments({}),
                this.courseRepository.collection.countDocuments({ status: 'ACTIVO' }),
                this._getGlobalAverageRating()
            ]);

            return {
                totalStudents,
                totalQueries,
                totalActiveCourses: totalCourses,
                globalAverageRating: overallRating,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error al generar el resumen del dashboard:', error.message);
            throw error;
        }
    }

    /**
     * Analiza el rendimiento de las interacciones con n8n desglosando por estados (RESPONDIDA, SIN_RESULTADOS, ERROR).
     * Desglose de estados, porcentaje de éxito y total de consultas.
     */
    async getAIMetrics() {
        const pipeline = [
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await this.queryRepository.collection.aggregate(pipeline).toArray();

        const metricsByStatus = {
            PENDIENTE: 0,
            RESPONDIDA: 0,
            SIN_RESULTADOS: 0,
            ERROR: 0
        };

        let totalInteractions = 0;

        results.forEach((item) => {
            if (item._id in metricsByStatus) {
                metricsByStatus[item._id] = item.count;
            }
            totalInteractions += item.count;
        });

        const successRate = totalInteractions > 0
            ? Number(((metricsByStatus.RESPONDIDA / totalInteractions) * 100).toFixed(2))
            : 0;

        return {
            totalInteractions,
            successRatePercentage: successRate,
            breakdown: metricsByStatus
        };
    }

    /**
     * Obtiene los cursos más frecuentemente recomendados por el motor RAG de n8n.
     * Cantidad de cursos a retornar en el ranking.
     * Ranking con IDs, títulos, apariciones y promedio de estrellas.
     */
    async getCourseStats(limit = 5) {
        const pipeline = [
            { $unwind: '$recommendedCourseIds' },
            {
                $group: {
                    _id: '$recommendedCourseIds',
                    totalRecommendations: { $sum: 1 }
                }
            },
            { $sort: { totalRecommendations: -1 } },
            { $limit: limit },
            {
                $addFields: {
                    courseObjectId: {
                        $cond: {
                            if: { $regexMatch: { input: '$_id', regex: /^[0-9a-fA-F]{24}$/ } },
                            then: { $toObjectId: '$_id' },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseObjectId',
                    foreignField: '_id',
                    as: 'courseDetails'
                }
            },
            { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    courseId: '$_id',
                    title: { $ifNull: ['$courseDetails.title', 'Curso Genérico'] },
                    category: { $ifNull: ['$courseDetails.category', 'General'] },
                    totalRecommendations: 1,
                    averageRating: { $ifNull: ['$courseDetails.averageRating', 0] }
                }
            }
        ];

        return await this.queryRepository.collection.aggregate(pipeline).toArray();
    }

    /**
     * Pipeline auxiliar para calcular la calificación promedio global de toda la plataforma.
     */
    async _getGlobalAverageRating() {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: '$score' }
                }
            }
        ];

        const result = await this.ratingRepository.collection.aggregate(pipeline).toArray();
        return result.length > 0 ? Number(result[0].avgScore.toFixed(2)) : 0;
    }
}