import StudentService from '../services/student.service.js';

export default class StudentController {
    constructor(studentService = new StudentService()) {
        this.studentService = studentService;

        this.register = this.register.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.getAllStudents = this.getAllStudents.bind(this);
    }

    async register(req, res, next) {
        try {
            const studentDto = req.body;
            const newStudent = await this.studentService.registerStudent(studentDto);

            return res.status(201).json({
                success: true,
                message: 'Estudiante registrado exitosamente.',
                data: newStudent
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const studentId = req.user.id;
            const studentProfile = await this.studentService.getStudentById(studentId);

            return res.status(200).json({
                success: true,
                data: studentProfile
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllStudents(req, res, next) {
        try {
            const { limit = 20, page = 1 } = req.query;
            const studentsList = await this.studentService.getAllStudents(Number(limit), Number(page));

            return res.status(200).json({
                success: true,
                data: studentsList
            });
        } catch (error) {
            next(error);
        }
    }
}