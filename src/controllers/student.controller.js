// src/controllers/student.controller.js
import StudentService from '../services/student.service.js';

export class StudentController {
    constructor(studentService = new StudentService()) {
        this.studentService = studentService;
    }

    /**
     * Consulta un estudiante por su ID (RF 02)
     * GET /api/v1/students/:id
     */
    getStudentById = async (req, res, next) => {
        try {
            const student = await this.studentService.getStudentById(req.params.id);
            return res.status(200).json({ success: true, data: student });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Lista estudiantes registrados (RF 02)
     * GET /api/v1/students
     */
    getAllStudents = async (req, res, next) => {
        try {
            const { limit = 50, page = 1 } = req.query;
            const students = await this.studentService.getAllStudents(limit, page);
            return res.status(200).json({
                success: true,
                count: students.length,
                data: students
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Historial de consultas de un estudiante (RF 02)
     * GET /api/v1/students/:id/history
     */
    getStudentHistory = async (req, res, next) => {
        try {
            const history = await this.studentService.getStudentHistory(req.params.id);
            return res.status(200).json({
                success: true,
                count: history.length,
                data: history
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Perfil del estudiante autenticado
     * GET /api/v1/students/me
     */
    getProfile = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const data = await this.studentService.getStudentById(studentId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getMyCourses = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const courses = await this.studentService.getMyCourses(studentId);
            return res.status(200).json({ success: true, data: courses });
        } catch (error) {
            next(error);
        }
    };
}

export default new StudentController();