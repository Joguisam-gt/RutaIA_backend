import StudentService from '../services/student.service.js';

export default class StudentController {
    constructor(studentService) {
        this.studentService = studentService;
    }

    getMyCourses = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const courses = await this.studentService.getMyCourses(studentId);
            return res.status(200).json({ success: true, data: courses });
        } catch (error) {
            next(error);
        }
    };

    getMetrics = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const data = await this.studentService.getStudentMetrics(studentId);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    };

    getCertificates = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const data = await this.studentService.getCertificates(studentId);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    };

    getWishlist = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const data = await this.studentService.getWishlist(studentId);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    };

    getProfile = async (req, res, next) => {
        try {
            const studentId = req.user?.id || req.user?._id;
            const data = await this.studentService.getStudentById(studentId);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    };
}