// src/controllers/course.controller.js
import CourseService from '../services/course.service.js';

export default class CourseController {
    constructor(courseService = new CourseService()) {
        this.courseService = courseService;
    }

    getAllCourses = async (req, res, next) => {
        try {
            const courses = await this.courseService.getAllCourses();
            return res.status(200).json({ success: true, data: courses });
        } catch (error) {
            next(error);
        }
    };

    getCourseById = async (req, res, next) => {
        try {
            const course = await this.courseService.getCourseById(req.params.id);
            return res.status(200).json({ success: true, data: course });
        } catch (error) {
            next(error);
        }
    };

    createCourse = async (req, res, next) => {
        try {
            const newCourse = await this.courseService.createCourse(req.body);
            return res.status(201).json({ success: true, data: newCourse });
        } catch (error) {
            next(error);
        }
    };

    updateCourse = async (req, res, next) => {
        try {
            const updated = await this.courseService.updateCourse(req.params.id, req.body);
            return res.status(200).json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    };

    deleteCourse = async (req, res, next) => {
        try {
            await this.courseService.deleteCourse(req.params.id);
            return res.status(200).json({ success: true, message: 'Curso eliminado.' });
        } catch (error) {
            next(error);
        }
    };
}