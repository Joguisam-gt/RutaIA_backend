// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';
import { JWT_SECRET } from '../config/environment.js';
import { AppError } from '../errors/appError.js';

export class AuthService {
    /**
     * Valida credenciales e inicia sesión para estudiantes y administradores.
     */
    async login({ email, password }) {
        const sanitizedEmail = (email || '').toLowerCase().trim();

        if (!sanitizedEmail || !password) {
            throw new AppError('El correo electrónico y la contraseña son obligatorios.', 400);
        }

        const db = Database.getDb();
        const user = await db.collection('users').findOne({ email: sanitizedEmail });

        if (!user) {
            throw new AppError('Credenciales inválidas. El usuario no existe.', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Credenciales inválidas. Contraseña incorrecta.', 401);
        }

        // Firma del Token JWT
        const token = jwt.sign(
            {
                id: String(user._id),
                name: user.name,
                email: user.email,
                role: user.role || 'student',
                level: user.level || 'PRINCIPIANTE'
            },
            JWT_SECRET || 'rutaia_secret_jwt_key_2026',
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return {
            token,
            user: {
                id: String(userWithoutPassword._id),
                ...userWithoutPassword
            }
        };
    }

    /**
     * Registra un nuevo estudiante cumpliendo con user.schema.json
     */
    async register(userData) {
        const { name, email, password, role = 'student', level = 'PRINCIPIANTE', areaOfInterest = 'Tecnología' } = userData;

        const sanitizedEmail = (email || '').toLowerCase().trim();

        if (!name || name.trim().length < 2) {
            throw new AppError('El nombre es obligatorio y debe contener al menos 2 caracteres.', 400);
        }

        if (!sanitizedEmail) {
            throw new AppError('El correo electrónico es obligatorio.', 400);
        }

        if (!password || password.length < 6) {
            throw new AppError('La contraseña debe tener al menos 6 caracteres.', 400);
        }

        const db = Database.getDb();
        const existingUser = await db.collection('users').findOne({ email: sanitizedEmail });

        if (existingUser) {
            throw new AppError('Ya existe una cuenta registrada con este correo electrónico.', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();

        const newUserDocument = {
            _id: new ObjectId(),
            name: name.trim(),
            email: sanitizedEmail,
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : 'student',
            level: ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'].includes(level) ? level : 'PRINCIPIANTE',
            areaOfInterest: areaOfInterest || 'General',
            createdAt: now,
            updatedAt: now
        };

        await db.collection('users').insertOne(newUserDocument);

        const token = jwt.sign(
            {
                id: String(newUserDocument._id),
                name: newUserDocument.name,
                email: newUserDocument.email,
                role: newUserDocument.role,
                level: newUserDocument.level
            },
            JWT_SECRET || 'rutaia_secret_jwt_key_2026',
            { expiresIn: '24h' }
        );

        const { password: _, ...createdUser } = newUserDocument;

        return {
            token,
            user: {
                id: String(createdUser._id),
                ...createdUser
            }
        };
    }

    /**
     * Obtiene el perfil actual del usuario a partir del ID del Token JWT.
     */
    async getMe(userId) {
        if (!userId) {
            throw new AppError('Usuario no autenticado.', 401);
        }

        const db = Database.getDb();
        let searchId;

        try {
            searchId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
        } catch {
            searchId = userId;
        }

        const user = await db.collection('users').findOne(
            { _id: searchId },
            { projection: { password: 0 } }
        );

        if (!user) {
            throw new AppError('Usuario no encontrado.', 404);
        }

        return {
            id: String(user._id),
            ...user
        };
    }
}

export default new AuthService();