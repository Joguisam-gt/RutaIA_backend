import { describe, it, expect, vi, beforeEach } from 'vitest';
import RatingService from '../../src/services/rating.service.js';
import CreateRatingDTO from '../../src/dtos/rating/createRating.dto.js';

// Sesión simulada de MongoDB para validar el Rollback
const mockSession = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn().mockResolvedValue(),
    endSession: vi.fn().mockResolvedValue(),
    inTransaction: vi.fn().mockReturnValue(true)
};

// Mock de la base de datos a nivel de módulo en Vitest
vi.mock('../../src/config/database.js', () => ({
    default: {
        getDb: vi.fn(() => ({
            client: {
                startSession: () => mockSession
            }
        }))
    }
}));

describe('RatingService ACID Transaction Rollback Tests', () => {
    let mockRatingRepository;
    let mockCourseRepository;
    let ratingService;

    beforeEach(() => {
        vi.clearAllMocks();

        // Repositorios simulados
        mockRatingRepository = {
            findOne: vi.fn().mockResolvedValue(null), // El estudiante aún no ha calificado
            create: vi.fn().mockResolvedValue({ _id: 'rating_123', score: 5 })
        };

        mockCourseRepository = {
            findOne: vi.fn().mockResolvedValue({ _id: 'course_123', averageRating: 4.0, totalRatings: 2 }),
            // Forzamos un error durante la actualización del curso para desencadenar el Rollback
            update: vi.fn().mockRejectedValue(new Error('Falla de conexión inesperada en la base de datos'))
        };

        ratingService = new RatingService(mockRatingRepository, mockCourseRepository);
    });

    it('Debe ejecutar session.abortTransaction() y realizar Rollback si ocurre un fallo al actualizar el curso', async () => {
        const rawRatingPayload = {
            courseId: 'course_123',
            studentId: 'student_456',
            score: 5,
            comment: 'Excelente curso',
            courseTitle: 'Node.js Avanzado',
            courseCategory: 'Backend',
            studentName: 'José Rodríguez'
        };

        const ratingDto = CreateRatingDTO.fromRequest(rawRatingPayload);

        // Validar que se lance el error forzado
        await expect(ratingService.addRatingWithTransaction(ratingDto)).rejects.toThrow(
            'Falla de conexión inesperada en la base de datos'
        );

        // Verificaciones de la transacción y Rollback
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);
        expect(mockRatingRepository.create).toHaveBeenCalledTimes(1);
        expect(mockCourseRepository.update).toHaveBeenCalledTimes(1);

        // Confirmar que NO se confirmó la transacción y SÍ se abortó (Rollback)
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
        expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });
});