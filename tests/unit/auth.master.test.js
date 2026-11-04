import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthControllerImport from '../../src/controllers/auth.controller.js';
import authService from '../../src/services/auth.service.js';
import { AuthMiddleware } from '../../src/middlewares/auth.middleware.js';
import Database from '../../src/config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Si exportaste la clase, la instanciamos para el test; si es instancia, la usamos directo
const authController = typeof AuthControllerImport === 'function' 
    ? new AuthControllerImport() 
    : AuthControllerImport;

vi.mock('../../src/config/database.js');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('Módulo Completo de Autenticación (Auth Master Suite)', () => {
    let mockUsersCollection;
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = { body: {}, headers: {}, user: null };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        next = vi.fn();

        mockUsersCollection = {
            findOne: vi.fn(),
            insertOne: vi.fn()
        };
        vi.spyOn(Database, 'getDb').mockReturnValue({
            collection: vi.fn().mockReturnValue(mockUsersCollection)
        });
    });

    describe('1. Capa de Servicio (auth.service.js)', () => {
        const studentData = {
            name: 'Sofia Martinez',
            email: 'sofia@rutaia.edu',
            password: 'Password123!',
            level: 'PRINCIPIANTE', // En mayúsculas según tu código actual
            areaOfInterest: 'Tecnología'
        };

        it('Debe registrar exitosamente a un estudiante', async () => {
            mockUsersCollection.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed_secret');
            jwt.sign.mockReturnValue('jwt_mock_token');

            const result = await authService.register(studentData);

            expect(result).toHaveProperty('token', 'jwt_mock_token');
            expect(result.user).toHaveProperty('email', 'sofia@rutaia.edu');
            expect(result.user).toHaveProperty('level', 'PRINCIPIANTE');
            expect(mockUsersCollection.insertOne).toHaveBeenCalledTimes(1);
        });

        it('Debe impedir correos electrónicos duplicados con tu mensaje actual', async () => {
            mockUsersCollection.findOne.mockResolvedValue({ email: 'sofia@rutaia.edu' });

            await expect(authService.register(studentData)).rejects.toThrow(
                'Ya existe una cuenta registrada con este correo electrónico.'
            );
        });
    });

    describe('2. Capa de Middleware (auth.middleware.js)', () => {
        // En tu archivo actual el método estático se llama authMiddleware
        const authHandler = AuthMiddleware.authMiddleware || AuthMiddleware.authenticate;

        it('Debe rechazar con 401 si no se envía la cabecera Authorization', () => {
            req.headers.authorization = undefined;

            authHandler(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(401);
        });

        it('Debe inyectar req.user si el token es válido', () => {
            req.headers.authorization = 'Bearer token_valido';
            const decoded = { id: 'u1', role: 'student' };
            jwt.verify.mockReturnValue(decoded);

            authHandler(req, res, next);

            expect(req.user).toEqual(decoded);
            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('3. Capa de Controlador (auth.controller.js)', () => {
        it('login() debe responder con 200 y mensaje exitoso', async () => {
            req.body = { email: 'sofia@rutaia.edu', password: 'Password123!' };
            vi.spyOn(authService, 'login').mockResolvedValue({
                token: 'tok_123',
                user: { id: 'u1' }
            });

            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Inicio de sesión exitoso.'
            }));
        });

        it('logout() debe responder con 200', async () => {
            await authController.logout(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});