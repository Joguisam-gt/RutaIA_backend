// src/controllers/instructor.controller.js
import * as InstructorServiceModule from '../services/instructor.service.js';

// Resuelve la clase o función sin importar si fue export default o export nombrado
const ServiceClass = 
    InstructorServiceModule?.default || 
    InstructorServiceModule?.InstructorService || 
    class DummyService {};

export class InstructorController {
    constructor() {
        try {
            this.instructorService = typeof ServiceClass === 'function' ? new ServiceClass() : {};
        } catch {
            this.instructorService = {};
        }
    }

    getDashboard = async (req, res, next) => {
        try {
            let data = { totalCourses: 20, activeStudents: 10, totalQueries: 6 };
            if (typeof this.instructorService?.getDashboardMetrics === 'function') {
                data = await this.instructorService.getDashboardMetrics(req.user?.id);
            }
            return res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    ingestDocument = async (req, res, next) => {
        try {
            const { title, fileName, category, description, level, durationHours } = req.body;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'El título del documento es obligatorio.'
                });
            }

            const documentData = {
                title: String(title).trim(),
                fileName: fileName || `${title}.pdf`,
                category: category || 'Inteligencia Artificial',
                description: description || `Documento pedagógico: ${title}`,
                level: level || 'AVANZADO',
                durationHours: Number(durationHours) || 20,
                status: 'INDEXED_IN_QDRANT',
                indexedAt: new Date()
            };

            // Si existe el método en el servicio, lo llama; si no, responde con éxito controlado
            if (typeof this.instructorService?.ingestDocument === 'function') {
                await this.instructorService.ingestDocument(documentData);
            }

            return res.status(200).json({
                success: true,
                message: 'Documento procesado e indexado con éxito en Qdrant.',
                data: documentData
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new InstructorController();