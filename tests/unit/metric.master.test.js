// tests/unit/metric.master.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MetricService from '../../src/services/metric.service.js';
import Database from '../../src/config/database.js';
import { queryStatus } from '../../src/constants/queryStatus.js';

vi.mock('../../src/config/database.js');

describe('Módulo Completo de Estadísticas y Métricas (RF 18 Master Suite)', () => {
    let metricService;
    let mockQueriesCollection;
    let mockRatingsCollection;
    let mockRecsCollection;

    beforeEach(() => {
        vi.clearAllMocks();

        mockQueriesCollection = {
            countDocuments: vi.fn()
        };

        mockRatingsCollection = {
            aggregate: vi.fn().mockReturnValue({
                toArray: vi.fn()
            })
        };

        mockRecsCollection = {
            aggregate: vi.fn().mockReturnValue({
                toArray: vi.fn()
            })
        };

        vi.spyOn(Database, 'getDb').mockReturnValue({
            collection: vi.fn((name) => {
                if (name === 'queries') return mockQueriesCollection;
                if (name === 'ratings') return mockRatingsCollection;
                if (name === 'recommendations') return mockRecsCollection;
                return {};
            })
        });

        metricService = new MetricService();
    });

    it('[RF 18] Debe calcular y presentar las 5 estadísticas básicas de la plataforma', async () => {
        // Simular conteo de consultas
        mockQueriesCollection.countDocuments.mockImplementation((filter) => {
            if (!filter) return Promise.resolve(100); // Total
            if (filter.status === queryStatus.ANSWERED) return Promise.resolve(80); // Respondidas
            if (filter.status === queryStatus.NO_RESULTS) return Promise.resolve(15); // Sin resultados
            if (filter.status === queryStatus.ERROR) return Promise.resolve(5); // Errores
            return Promise.resolve(0);
        });

        // Simular agregación de promedio de calificaciones
        mockRatingsCollection.aggregate().toArray.mockResolvedValue([
            { _id: null, averageRating: 4.75, totalRatings: 42 }
        ]);

        // Simular agregación del curso más recomendado
        mockRecsCollection.aggregate().toArray.mockResolvedValue([
            {
                _id: 'course_node_99',
                courseTitle: 'Node.js y Arquitectura Limpia',
                recommendationCount: 28
            }
        ]);

        const stats = await metricService.getPlatformStats();

        // 1. Total consultas
        expect(stats.totalQueries).toBe(100);
        // 2. Respondidas
        expect(stats.answeredQueries).toBe(80);
        // 3. Sin resultados
        expect(stats.noResultsQueries).toBe(15);
        // 4. Promedio de calificaciones
        expect(stats.averageRating).toBe(4.75);
        expect(stats.totalRatings).toBe(42);
        // 5. Curso más recomendado
        expect(stats.mostRecommendedCourse).toEqual({
            courseId: 'course_node_99',
            title: 'Node.js y Arquitectura Limpia',
            count: 28
        });
    });

    it('[RF 18] Debe devolver valores seguros por defecto cuando no hay datos en el sistema', async () => {
        mockQueriesCollection.countDocuments.mockResolvedValue(0);
        mockRatingsCollection.aggregate().toArray.mockResolvedValue([]);
        mockRecsCollection.aggregate().toArray.mockResolvedValue([]);

        const stats = await metricService.getPlatformStats();

        expect(stats.totalQueries).toBe(0);
        expect(stats.answeredQueries).toBe(0);
        expect(stats.noResultsQueries).toBe(0);
        expect(stats.averageRating).toBe(0);
        expect(stats.mostRecommendedCourse.title).toBe('No hay cursos recomendados aún');
    });
});