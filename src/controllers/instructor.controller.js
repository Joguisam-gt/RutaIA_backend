// src/controllers/instructor.controller.js
import InstructorService from '../services/instructor.service.js';

export default class InstructorController {
    constructor(instructorService = new InstructorService()) {
        this.instructorService = instructorService;
    }

    getDashboardMetrics = async (req, res, next) => {
        try {
            const data = await this.instructorService.getDashboardMetrics();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getStudents = async (req, res, next) => {
        try {
            const data = await this.instructorService.getStudentsRealtime();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getQdrantGraph = async (req, res, next) => {
        try {
            const data = await this.instructorService.getQdrantKnowledgeGraph();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    ingestDocument = async (req, res, next) => {
        try {
            const payload = req.body;
            const result = await this.instructorService.triggerN8nIngestion(payload);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}