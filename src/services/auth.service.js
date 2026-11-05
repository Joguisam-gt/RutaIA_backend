// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';
import { environment } from '../config/environment.js';

import AppErrorImport from '../errors/appError.js';
import BadRequestErrorImport from '../errors/badRequestError.js';
import NotFoundErrorImport from '../errors/notFoundError.js';

// Resolucion segura de clases de error para ES Modules
const AppError = AppErrorImport?.AppError || AppErrorImport;
const BadRequestError = BadRequestErrorImport?.BadRequestError || BadRequestErrorImport || AppError;
const NotFoundError = NotFoundErrorImport?.NotFoundError || NotFoundErrorImport || AppError;

// Niveles permitidos estrictamente en MAYUSCULAS segun user.schema.json
const ALLOWED_LEVELS = Object.freeze(['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO']);

export class AuthService {
    /**
     * Valida credenciales e inicia sesion
     */
    async login({ email, password }) {
        const sanitizedEmail = (email || '').toLowerCase().trim();

        if (!sanitizedEmail || !password) {
            throw new BadRequestError('El correo electronico y la contraseña son obligatorios.');
        }

        const db = Database.getDb();
        const user = await db.collection('users').findOne({ email: sanitizedEmail });

        if (!user) {
            throw new AppError('Credenciales invalidas. El usuario no existe.', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Credenciales invalidas. Contraseña incorrecta.', 401);
        }

        const token = this.generateToken(user);
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
     * Registra un nuevo estudiante cumpliendo estrictamente con user.schema.json
     */
    async register(userData) {
        const {
            name,
            email,
            password,
            role = 'student',
            level = 'PRINCIPIANTE',
            areaOfInterest
        } = userData;

        const sanitizedEmail = (email || '').toLowerCase().trim();
        const trimmedName = (name || '').trim();

        if (!trimmedName || trimmedName.length < 2) {
            throw new BadRequestError('El nombre completo es obligatorio y debe tener al menos 2 caracteres.');
        }

        if (!sanitizedEmail) {
            throw new BadRequestError('El correo electronico es obligatorio.');
        }

        if (!password || password.length < 6) {
            throw new BadRequestError('La contraseña debe tener al menos 6 caracteres.');
        }

        // Normalizacion y validacion estricta de niveles
        const normalizedLevel = String(level).toUpperCase();
        if (!ALLOWED_LEVELS.includes(normalizedLevel)) {
            throw new BadRequestError(`El nivel de experiencia debe ser uno de los siguientes: ${ALLOWED_LEVELS.join(', ')}.`);
        }

        if (!areaOfInterest || String(areaOfInterest).trim().length === 0) {
            throw new BadRequestError('El area de interes es obligatoria.');
        }

        const db = Database.getDb();

        // Regla de Negocio: Impedir correos duplicados
        const existingUser = await db.collection('users').findOne({ email: sanitizedEmail });
        if (existingUser) {
            throw new BadRequestError('Ya existe un estudiante registrado con este correo electronico.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();

        // Estructura exacta exigida por MongoDB
        const newUserDocument = {
            _id: new ObjectId(),
            name: trimmedName,
            email: sanitizedEmail,
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : 'student',
            level: normalizedLevel,
            areaOfInterest: String(areaOfInterest).trim(),
            createdAt: now,
            updatedAt: now
        };

        await db.collection('users').insertOne(newUserDocument);

        const token = this.generateToken(newUserDocument);
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
     * Obtiene el perfil actual del usuario autenticado
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
            throw new NotFoundError('Estudiante o usuario no encontrado.');
        }

        return {
            id: String(user._id),
            ...user
        };
    }

    /**
     * Firma de JWT centralizada
     */
    generateToken(user) {
        if (!environment.jwtSecret) {
            throw new Error('Configuracion critica ausente: JWT_SECRET no esta definido en las variables de entorno.');
        }

        return jwt.sign(
            {
                id: String(user._id),
                name: user.name,
                email: user.email,
                role: user.role || 'student',
                level: user.level
            },
            environment.jwtSecret,
            { expiresIn: '24h' }
        );
    }   
}

export default new AuthService();