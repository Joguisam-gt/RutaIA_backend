// tests/unit/rating.master.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RatingService from '../../src/services/rating.service.js';

describe('Módulo Completo de Calificaciones (RF 17 Master Suite)', () => {
    let ratingService;
    let mockRatingRepo;
    let mockRecRepo;
    let mockCourseRepo;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRatingRepo = {
            create: vi.fn(),
            findOne: vi.fn(),
            getAverageScore: vi.fn()
        };

        mockRecRepo = {
            findById: vi.fn()
        };

        mockCourseRepo = {
            findOne: vi.fn(),
            update: vi.fn()
        };

        ratingService = new RatingService(mockRatingRepo, mockRecRepo, mockCourseRepo);
    });

    describe('Reglas de Negocio de Calificación (RF 17)', () => {
        const studentId = 'student_abc';
        const validPayload = {
            recommendationId: 'rec_123',
            score: 5,
            comment: 'Excelente recomendación de la IA.'
        };

        it('[RF 17] Debe registrar una calificación válida entre 1 y 5 con comentario opcional', async () => {
            mockRecRepo.findById.mockResolvedValue({ _id: 'rec_123' });
            mockRatingRepo.findOne.mockResolvedValue(null); // No hay calificación previa
            mockRatingRepo.create.mockImplementation(doc => Promise.resolve({ _id: 'rating_1', ...doc }));

            const result = await ratingService.rateRecommendation(studentId, validPayload);

            expect(result).toHaveProperty('score', 5);
            expect(result).toHaveProperty('recommendationId', 'rec_123');
            expect(result).toHaveProperty('studentId', studentId);
            expect(result.comment).toBe('Excelente recomendación de la IA.');
            expect(mockRatingRepo.create).toHaveBeenCalledTimes(1);
        });

        it('[Regla de Negocio] Debe rechazar calificaciones menores a 1 o mayores a 5', async () => {
            await expect(ratingService.rateRecommendation(studentId, { ...validPayload, score: 0 })).rejects.toThrow(
                /La calificación debe ser un número entero entre 1 y 5/
            );
            await expect(ratingService.rateRecommendation(studentId, { ...validPayload, score: 6 })).rejects.toThrow(
                /La calificación debe ser un número entero entre 1 y 5/
            );
            await expect(ratingService.rateRecommendation(studentId, { ...validPayload, score: 3.5 })).rejects.toThrow(
                /La calificación debe ser un número entero entre 1 y 5/
            );
        });

        it('[RF 17] Debe aceptar calificaciones sin comentario (comentario opcional)', async () => {
            mockRecRepo.findById.mockResolvedValue({ _id: 'rec_123' });
            mockRatingRepo.findOne.mockResolvedValue(null);
            mockRatingRepo.create.mockImplementation(doc => Promise.resolve({ _id: 'rating_2', ...doc }));

            const result = await ratingService.rateRecommendation(studentId, {
                recommendationId: 'rec_123',
                score: 4
            });

            expect(result.score).toBe(4);
            expect(result.comment).toBeNull();
        });

        it('[Regla de Negocio] Debe rechazar una segunda calificación para la misma recomendación (Una sola calificación)', async () => {
            mockRecRepo.findById.mockResolvedValue({ _id: 'rec_123' });
            // Simular que ya existe una calificación en base de datos
            mockRatingRepo.findOne.mockResolvedValue({ _id: 'existing_rating', score: 5 });

            await expect(ratingService.rateRecommendation(studentId, validPayload)).rejects.toThrow(
                /Esta recomendación ya ha sido calificada previamente/
            );
            expect(mockRatingRepo.create).not.toHaveBeenCalled();
        });
    });
});