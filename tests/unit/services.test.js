import { describe, it, expect, vi } from 'vitest';
import StudentService from '../../src/services/student.service.js';
import BadRequestError from '../../src/errors/badRequestError.js';

describe('StudentService Unit Tests (Mocks)', () => {
    it('Debe rechazar el registro de un estudiante con correo ya existente', async () => {
        // Mock del repositorio
        const mockStudentRepository = {
            findByEmail: vi.fn().mockResolvedValue({ _id: '123', email: 'existente@test.com' }),
            create: vi.fn()
        };

        const studentService = new StudentService(mockStudentRepository);
        const mockDto = { name: 'José', email: 'existente@test.com', level: 'INTERMEDIO', areaOfInterest: 'IA' };

        await expect(studentService.registerStudent(mockDto)).rejects.toThrow(BadRequestError);
        expect(mockStudentRepository.findByEmail).toHaveBeenCalledWith('existente@test.com');
        expect(mockStudentRepository.create).not.toHaveBeenCalled();
    });
});