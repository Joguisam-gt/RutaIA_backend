// tests/unit/course.master.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseController } from '../../src/controllers/course.controller.js';
import CourseService from '../../src/services/course.service.js';
import Database from '../../src/config/database.js';

vi.mock('../../src/config/database.js');

describe('Módulo Completo de Cursos (Course Master Suite)', () => {
    let courseService;
    let mockCourseCollection;
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = { body: {}, params: {}, query: {}, user: null };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        next = vi.fn();

        mockCourseCollection = {
            insertOne: vi.fn(),
            findOne: vi.fn(),
            find: vi.fn().mockReturnThis(),
            sort: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            toArray: vi.fn(),
            findOneAndUpdate: vi.fn()
        };

        vi.spyOn(Database, 'getDb').mockReturnValue({
            collection: vi.fn().mockReturnValue(mockCourseCollection)
        });

        courseService = new CourseService();
    });

    // ==========================================
    // 1. REGLAS DE NEGOCIO Y SERVICIO (RF 03, RF 04)
    // ==========================================
    describe('1. Reglas de Negocio en CourseService', () => {
        const validCourse = {
            title: 'Node.js y Microservicios',
            description: 'Aprende arquitectura hexagonal y APIs robustas.',
            category: 'Backend',
            level: 'Intermedio',
            durationHours: 40
        };

        it('[RF 03] Debe registrar un curso exitosamente con nivel y duración válidos', async () => {
            mockCourseCollection.insertOne.mockResolvedValue({ insertedId: 'course_123' });

            const result = await courseService.createCourse(validCourse);

            expect(result).toHaveProperty('title', 'Node.js y Microservicios');
            expect(result).toHaveProperty('level', 'Intermedio');
            expect(result).toHaveProperty('duration', 40);
            expect(result).toHaveProperty('status', 'ACTIVO');
            expect(result).toHaveProperty('isVisible', true);
        });

        it('[Regla de Negocio] Debe rechazar el registro si el nombre o descripción faltan', async () => {
            const courseWithoutDesc = { ...validCourse, description: '   ' };

            await expect(courseService.createCourse(courseWithoutDesc)).rejects.toThrow(
                /La descripción del curso es obligatoria/
            );
        });

        it('[Regla de Negocio] Debe rechazar cursos con duración menor o igual a cero', async () => {
            const zeroDurationCourse = { ...validCourse, durationHours: 0 };
            const negativeDurationCourse = { ...validCourse, durationHours: -10 };

            await expect(courseService.createCourse(zeroDurationCourse)).rejects.toThrow(
                /La duración del curso deberá ser mayor que cero/
            );
            await expect(courseService.createCourse(negativeDurationCourse)).rejects.toThrow(
                /La duración del curso deberá ser mayor que cero/
            );
        });

        it('[RF 03] Solo debe aceptar los niveles Básico, Intermedio y Avanzado', async () => {
            const invalidLevelCourse = { ...validCourse, level: 'Master / Experto' };

            await expect(courseService.createCourse(invalidLevelCourse)).rejects.toThrow(
                /Nivel inválido. Los niveles permitidos son: Básico, Intermedio, Avanzado/
            );
        });

        it('[RF 03 & Reglas] deleteCourse debe realizar DESACTIVACIÓN LÓGICA y no borrado físico', async () => {
            mockCourseCollection.findOne.mockResolvedValue({ _id: 'course_123', title: 'Vue.js' });
            mockCourseCollection.findOneAndUpdate.mockResolvedValue({
                _id: 'course_123',
                title: 'Vue.js',
                status: 'INACTIVO',
                isVisible: false
            });

            await courseService.deleteCourse('course_123');

            // Verifica que actualizó el estado a INACTIVO
            expect(mockCourseCollection.findOneAndUpdate).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        status: 'INACTIVO',
                        isVisible: false
                    })
                }),
                expect.anything()
            );
        });

        it('[RF 04] El catálogo para estudiantes o visitantes anónimos solo debe consultar cursos activos', async () => {
            mockCourseCollection.toArray.mockResolvedValue([validCourse]);

            await courseService.getCourses({ category: 'Backend' }, 'guest');

            expect(mockCourseCollection.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'Backend',
                    status: 'ACTIVO',
                    isVisible: true
                })
            );
        });
    });

    // ==========================================
    // 2. CAPA DE CONTROLADOR (CourseController)
    // ==========================================
    describe('2. Capa de Controlador (CourseController)', () => {
        let mockService;
        let testController;

        beforeEach(() => {
            mockService = {
                getAllCourses: vi.fn(),
                createCourse: vi.fn(),
                getCourseById: vi.fn(),
                deleteCourse: vi.fn()
            };

            testController = new CourseController(mockService);
        });

        it('getAllCourses() debe devolver status 200 y la lista de cursos', async () => {
            req.query = { category: 'Backend' };
            mockService.getAllCourses.mockResolvedValue([
                { id: '1', title: 'Curso 1' },
                { id: '2', title: 'Curso 2' }
            ]);

            await testController.getAllCourses(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                count: 2
            }));
            expect(mockService.getAllCourses).toHaveBeenCalledWith(
                { category: 'Backend', level: undefined, status: undefined },
                'guest'
            );
        });

        it('createCourse() debe responder con status 201 y mensaje de éxito', async () => {
            req.body = { title: 'Nuevo Curso' };
            mockService.createCourse.mockResolvedValue({
                id: 'course_99',
                title: 'Nuevo Curso'
            });

            await testController.createCourse(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Curso creado exitosamente.'
            }));
            expect(mockService.createCourse).toHaveBeenCalledWith(req.body);
        });
    });
});