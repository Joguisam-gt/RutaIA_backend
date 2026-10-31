import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

// Mock del conector de base de datos para no requerir un servidor real corriendo
vi.mock('../../src/config/database.js', () => ({
    default: {
        getDb: () => ({
            collection: () => ({
                findOne: vi.fn().mockResolvedValue(null),
                insertOne: vi.fn().mockResolvedValue({ insertedId: '60c72b2f9b1d8b2b88888888' })
            })
        })
    }
}));

describe('Integration API Routes Tests (Supertest)', () => {
    it('GET /health debe responder estado UP (200 OK)', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('UP');
        expect(response.body.service).toBe('RutaIA Backend Bridge');
    });

    it('POST /api/v1/students debe retornar 400 Bad Request si la carga es inválida', async () => {
        const response = await request(app)
            .post('/api/v1/students')
            .send({ name: 'J' }); // Nombre demasiado corto

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('GET /ruta-inexistente debe retornar 404 Not Found', async () => {
        const response = await request(app).get('/api/v1/endpoint-no-existente');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});