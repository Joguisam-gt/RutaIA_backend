import { describe, it, expect, vi, beforeEach } from 'vitest';
import QueryService from '../../src/services/query.service.js';
import { queryStatus } from '../../src/constants/queryStatus.js';
import axios from 'axios';

vi.mock('axios');

describe('Módulo Completo de Consultas Inteligentes y RAG (Query Master Suite)', () => {
    let queryService;
    let mockQueryRepo;
    let mockRecRepo;
    let mockStudentRepo;

    beforeEach(() => {
        vi.clearAllMocks();

        mockQueryRepo = {
            create: vi.fn(),
            updateById: vi.fn(),
            findWithPagination: vi.fn()
        };

        mockRecRepo = {
            create: vi.fn()
        };

        mockStudentRepo = {
            findById: vi.fn()
        };

        queryService = new QueryService(mockQueryRepo, mockRecRepo, mockStudentRepo);
    });

    describe('Reglas de Negocio y Flujo RAG (RF 06 al RF 14)', () => {
        const studentPayload = {
            studentId: 'student_99',
            question: '¿Qué curso me recomiendas para iniciarme en Inteligencia Artificial?',
            studentLevel: 'Principiante',
            studentAreaOfInterest: 'Inteligencia Artificial'
        };

        it('[Regla de Negocio] Debe rechazar preguntas vacías y NO enviarlas a n8n', async () => {
            await expect(queryService.processQuery({ ...studentPayload, question: '   ' })).rejects.toThrow(
                /La pregunta no puede estar vacía/
            );
            expect(axios.post).not.toHaveBeenCalled();
            expect(mockQueryRepo.create).not.toHaveBeenCalled();
        });

        it('[RF 07 & RF 08] Debe registrar la consulta como "Pendiente" y luego invocar el webhook de n8n', async () => {
            mockQueryRepo.create.mockResolvedValue({ _id: 'query_123', createdAt: new Date() });
            mockStudentRepo.findById.mockResolvedValue({ level: 'Principiante', areaOfInterest: 'IA' });

            // Simular respuesta exitosa de n8n con fuentes (RF 10, RF 12, RF 13)
            axios.post.mockResolvedValue({
                data: {
                    answer: 'Te recomendamos comenzar con Introducción a la IA.',
                    sources: [
                        { id: 'c1', title: 'Introducción a la IA', category: 'IA', similarity: 0.88 }
                    ]
                }
            });

            const result = await queryService.processQuery(studentPayload);

            // Verificación RF 07: Primero se crea en estado Pendiente
            expect(mockQueryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    studentId: 'student_99',
                    status: queryStatus.PENDING
                })
            );

            // Verificación RF 08: Se envía a n8n el ID, pregunta, nivel y área
            expect(axios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    queryId: 'query_123',
                    question: studentPayload.question,
                    experienceLevel: 'Principiante',
                    interestArea: 'IA'
                }),
                expect.anything()
            );

            // Verificación RF 13: Finaliza como Respondida
            expect(result.status).toBe(queryStatus.ANSWERED);
            expect(result.sources).toHaveLength(1);
        });

        it('[RF 11] Si Qdrant/n8n no encuentra cursos relevantes, debe finalizar como "Sin resultados"', async () => {
            mockQueryRepo.create.mockResolvedValue({ _id: 'query_456', createdAt: new Date() });
            
            // Simular respuesta de n8n sin fuentes relevantes (bajo el umbral)
            axios.post.mockResolvedValue({
                data: {
                    answer: 'No encontré ningún curso que coincida con tu búsqueda.',
                    sources: []
                }
            });

            const result = await queryService.processQuery(studentPayload);

            expect(result.status).toBe(queryStatus.NO_RESULTS);
            expect(mockQueryRepo.updateById).toHaveBeenCalledWith(
                'query_456',
                expect.objectContaining({ status: queryStatus.NO_RESULTS })
            );
        });

        it('[Regla de Negocio] Si n8n, Qdrant o Gemini fallan, la consulta debe finalizar como "Error"', async () => {
            mockQueryRepo.create.mockResolvedValue({ _id: 'query_789', createdAt: new Date() });
            
            // Simular caída o timeout de n8n/Gemini
            axios.post.mockRejectedValue(new Error('Connection timeout to n8n'));

            const result = await queryService.processQuery(studentPayload);

            expect(result.status).toBe(queryStatus.ERROR);
            expect(mockQueryRepo.updateById).toHaveBeenCalledWith(
                'query_789',
                expect.objectContaining({ status: queryStatus.ERROR })
            );
        });
    });
});