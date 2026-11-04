// src/controllers/metric.controller.js
import MetricService from '../services/metric.service.js';

export default class MetricController {
    constructor(metricService = new MetricService()) {
        this.metricService = metricService;
    }

    getStudentMetrics = async (req, res, next) => {
        try {
            const studentId = req.user.id || req.user._id;
            const metrics = await this.metricService.getMetricsByStudent(studentId);
            return res.status(200).json({ success: true, data: metrics });
        } catch (error) {
            next(error);
        }
    };
}