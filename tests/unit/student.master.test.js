// tests/unit/student.master.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentService from '../../src/services/student.service.js';
import Database from '../../src/config/database.js';

vi.mock('../../src/config/database.js');

describe('Módulo Completo de Estudiantes (RF 02 Master Suite)', () => {
    let studentService;
    let mockUsersCollection;
    let mockQueriesCollection;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUsersCollection = {
            findOne: vi.fn(),
            find: vi.fn().mockReturnThis(),
            sort: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            toArray: vi.fn()
        };

        mockQueriesCollection = {
            find: vi.fn().mockReturnThis(),
            sort: vi.fn().mockReturnThis(),
            toArray: vi.fn()
        };

        vi.spyOn(Database, 'getDb').mockReturnValue({
            collection: vi.fn((name) => {
                if (name === 'users') return mockUsersCollection;
                if (name === 'queries') return mockQueriesCollection;
                return {};
            })
        });

        studentService = new StudentService();
    });

    describe('Consultas de Estudiantes (RF 02)', () => {
        it('[RF 02] Debe consultar un estudiante por identificador', async () => {
            const mockStudent = {
                _id: '507f1f77bcf86cd799439011',
                name: 'Elena Gómez',
                email: 'elena@rutaia.edu',
                level: 'Intermedio',
                areaOfInterest: 'Bases de Datos',
                role: 'student'
            };
            mockUsersCollection.findOne.mockResolvedValue(mockStudent);

            const result = await studentService.getStudentById('507f1f77bcf86cd799439011');

            expect(result).toHaveProperty('name', 'Elena Gómez');
            expect(result).toHaveProperty('level', 'Intermedio');
            expect(result).toHaveProperty('areaOfInterest', 'Bases de Datos');
            expect(result).not.toHaveProperty('password');
        });

        it('[RF 02] Debe responder con error 404 cuando el estudiante no exista', async () => {
            mockUsersCollection.findOne.mockResolvedValue(null);

            await expect(studentService.getStudentById('id_inexistente')).rejects.toThrow(
                /El estudiante solicitado no existe/
            );
        });

        it('[RF 02] Debe listar los estudiantes registrados', async () => {
            mockUsersCollection.toArray.mockResolvedValue([
                { _id: '1', name: 'Estudiante 1', email: 'e1@test.com', level: 'Principiante' },
                { _id: '2', name: 'Estudiante 2', email: 'e2@test.com', level: 'Avanzado' }
            ]);

            const students = await studentService.getAllStudents(10, 1);

            expect(students).toHaveLength(2);
            expect(students[0].name).toBe('Estudiante 1');
            expect(students[1].level).toBe('Avanzado');
        });

        it('[RF 02] Debe consultar el historial de recomendaciones de un estudiante', async () => {
            // Simular estudiante existente
            mockUsersCollection.findOne.mockResolvedValue({ _id: 's_100', name: 'Elena' });
            // Simular historial de consultas
            mockQueriesCollection.toArray.mockResolvedValue([
                { _id: 'q1', question: '¿Qué curso de Mongo me recomiendas?', status: 'Respondida' },
                { _id: 'q2', question: '¿Tienen cursos de React?', status: 'Respondida' }
            ]);

            const history = await studentService.getStudentHistory('s_100');

            expect(history).toHaveLength(2);
            expect(history[0].question).toContain('Mongo');
            expect(history[0].status).toBe('Respondida');
        });
    });
});