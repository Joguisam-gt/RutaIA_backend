// src/controllers/metric.controller.js
import MetricService from '../services/metric.service.js';

export class MetricController {
    constructor(metricService = new MetricService()) {
        this.metricService = metricService;
    }

    /**
     * Obtiene las estadísticas básicas de la plataforma (RF 18)
     * GET /api/v1/metrics
     */
    getPlatformMetrics = async (req, res, next) => {
        try {
            const stats = await this.metricService.getPlatformStats();

            return res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente.',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Métricas individuales del estudiante
     * GET /api/v1/metrics/student
     */
    getStudentMetrics = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const metrics = await this.metricService.getMetricsByStudent(studentId);

            return res.status(200).json({
                success: true,
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new MetricController();