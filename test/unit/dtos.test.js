import { describe, it, expect } from 'vitest';
import CreateStudentDTO from '../../src/dtos/student/createStudent.dto.js';
import CreateCourseDTO from '../../src/dtos/course/createCourse.dto.js';
import AskQueryDTO from '../../src/dtos/query/askQuery.dto.js';
import BadRequestError from '../../src/errors/badRequestError.js';

describe('DTOs Validation Unit Tests', () => {
    it('CreateStudentDTO debe validar e inmutabilizar un objeto correcto', () => {
        const rawData = { name: 'José Rodríguez', email: 'JOSE@EXAMPLE.COM', level: 'PRINCIPIANTE' };
        const dto = CreateStudentDTO.fromRequest(rawData);

        expect(dto.email).toBe('jose@example.com');
        expect(Object.isFrozen(dto)).toBe(true);
    });

    it('CreateStudentDTO debe rechazar un correo con formato inválido', () => {
        const invalidData = { name: 'José', email: 'correo-invalido', level: 'PRINCIPIANTE' };
        expect(() => CreateStudentDTO.fromRequest(invalidData)).toThrow(BadRequestError);
    });

    it('CreateCourseDTO debe validar que la duración sea mayor a 0', () => {
        const invalidCourse = {
            title: 'Curso Node',
            description: 'Aprende Node.js desde cero',
            category: 'Backend',
            level: 'INTERMEDIO',
            durationHours: 0
        };
        expect(() => CreateCourseDTO.fromRequest(invalidCourse)).toThrow(BadRequestError);
    });

    it('AskQueryDTO debe rechazar preguntas vacías o con menos de 3 caracteres', () => {
        expect(() => AskQueryDTO.fromRequest({ studentId: '60c72b2f9b1d8b2b88888888', question: 'a' })).toThrow(BadRequestError);
    });
});