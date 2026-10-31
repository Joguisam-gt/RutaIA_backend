import queryRepositoryInstance from '../repositories/query.repository.js';
import courseRepositoryInstance from '../repositories/course.repository.js';
import studentRepositoryInstance from '../repositories/student.repository.js';
import ratingRepositoryInstance from '../repositories/rating.repository.js';
import logger from '../utils/logger.js';

/**
 * Servicio orientado a objetos para el cálculo de métricas y estadísticas del sistema (SRP & DIP 100% Cumplidos).
 * Orquesta la información obtenida desde la capa de repositorios sin acceder directamente a la base de datos.
 */
export default class MetricService {
    /**
     * Inyección de dependencias a través del constructor.
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
     */
    async getDashboardOverview() {
        try {
            const [totalStudents, totalQueries, totalCourses, overallRating] = await Promise.all([
                this.studentRepository.countByRole('student'),
                this.queryRepository.countTotalQueries(),
                this.courseRepository.countByStatus('ACTIVO'),
                this.ratingRepository.getGlobalAverageRating()
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
     * Analiza el rendimiento de las interacciones con n8n desglosando por estados.
     */
    async getAIMetrics() {
        const results = await this.queryRepository.getStatusBreakdown();
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
     */
    async getCourseStats(limit = 5) {
        return await this.queryRepository.getTopRecommendedCourses(limit);
    }
}