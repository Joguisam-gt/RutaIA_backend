// tests/unit/rateQuery.test.js
import { describe, it, expect, vi } from 'vitest';
import RateQueryDTO from '../../src/dtos/query/rateQuery.dto.js';
import QueryService from '../../src/services/query.service.js';
import BadRequestError from '../../src/errors/badRequestError.js';

describe('AI Interaction Rating Unit Tests', () => {
    describe('RateQueryDTO Validation Tests', () => {
        it('Debe aceptar calificaciones con estrellas enteras (1.0, 3.0, 5.0)', () => {
            const dto = RateQueryDTO.fromRequest({ queryId: 'q123', score: 4, comment: 'Buena respuesta' });
            expect(dto.score).toBe(4);
            expect(Object.isFrozen(dto)).toBe(true);
        });

        it('Debe aceptar calificaciones con medias estrellas (1.5, 2.5, 4.5)', () => {
            const dto = RateQueryDTO.fromRequest({ queryId: 'q123', score: 3.5, comment: 'Muy útil' });
            expect(dto.score).toBe(3.5);
        });

        it('Debe rechazar decimales inválidos que no sean incrementos de 0.5 (ej. 3.2, 4.8)', () => {
            expect(() => RateQueryDTO.fromRequest({ queryId: 'q123', score: 3.2 })).toThrow(BadRequestError);
            expect(() => RateQueryDTO.fromRequest({ queryId: 'q123', score: 4.8 })).toThrow(BadRequestError);
        });

        it('Debe rechazar calificaciones fuera del rango de 1 a 5 estrellas (ej. 0.5 o 5.5)', () => {
            expect(() => RateQueryDTO.fromRequest({ queryId: 'q123', score: 0.5 })).toThrow(BadRequestError);
            expect(() => RateQueryDTO.fromRequest({ queryId: 'q123', score: 5.5 })).toThrow(BadRequestError);
        });
    });

    describe('QueryService AI Rating Logic Tests', () => {
        it('Debe registrar la calificación invocando correctamente al repositorio', async () => {
            const mockQueryRepository = {
                addAIRating: vi.fn().mockResolvedValue({
                    _id: 'q123',
                    studentId: 's456',
                    aiRating: { score: 4.5, comment: 'Excelente' }
                })
            };

            const queryService = new QueryService(mockQueryRepository);
            const mockDto = { queryId: 'q123', score: 4.5, comment: 'Excelente' };

            const result = await queryService.rateAIInteraction('s456', mockDto);

            expect(mockQueryRepository.addAIRating).toHaveBeenCalledWith('q123', 's456', {
                score: 4.5,
                comment: 'Excelente'
            });
            expect(result.aiRating.score).toBe(4.5);
        });
    });
});