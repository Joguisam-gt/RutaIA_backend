// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';
import { environment } from '../config/environment.js';
import { AppError } from '../errors/appError.js';
import BadRequestError from '../errors/badRequestError.js';
import NotFoundError from '../errors/notFoundError.js';

// Niveles permitidos estrictamente por el RF 01
const ALLOWED_LEVELS = Object.freeze(['Principiante', 'Intermedio', 'Avanzado']);

export class AuthService {
    /**
     * Valida credenciales e inicia sesión para estudiantes y administradores.
     * @param {Object} credentials - { email, password }
     */
    async login({ email, password }) {
        const sanitizedEmail = (email || '').toLowerCase().trim();

        if (!sanitizedEmail || !password) {
            throw new BadRequestError('El correo electrónico y la contraseña son obligatorios.');
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

        // Generación del token sin secretos quemados en código
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
     * Registra un nuevo estudiante cumpliendo estrictamente con RF 01 y user.schema.json
     * @param {Object} userData - Datos de registro
     */
    async register(userData) {
        const { 
            name, 
            email, 
            password, 
            role = 'student', 
            level = 'Principiante', 
            areaOfInterest 
        } = userData;

        const sanitizedEmail = (email || '').toLowerCase().trim();
        const trimmedName = (name || '').trim();

        // Validaciones de RF 01
        if (!trimmedName || trimmedName.length < 2) {
            throw new BadRequestError('El nombre completo es obligatorio y debe tener al menos 2 caracteres.');
        }

        if (!sanitizedEmail) {
            throw new BadRequestError('El correo electrónico es obligatorio.');
        }

        if (!password || password.length < 6) {
            throw new BadRequestError('La contraseña debe tener al menos 6 caracteres.');
        }

        // Validación estricta de niveles RF 01
        if (!ALLOWED_LEVELS.includes(level)) {
            throw new BadRequestError(`El nivel de experiencia debe ser uno de los siguientes: ${ALLOWED_LEVELS.join(', ')}.`);
        }

        if (!areaOfInterest || areaOfInterest.trim().length === 0) {
            throw new BadRequestError('El área de interés es obligatoria.');
        }

        const db = Database.getDb();
        const existingUser = await db.collection('users').findOne({ email: sanitizedEmail });

        // Regla de Negocio: Impedir correos duplicados
        if (existingUser) {
            throw new BadRequestError('Ya existe un estudiante registrado con este correo electrónico.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();

        const newUserDocument = {
            _id: new ObjectId(),
            name: trimmedName,
            email: sanitizedEmail,
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : 'student',
            level,
            areaOfInterest: areaOfInterest.trim(),
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
     * Obtiene el perfil actual del usuario autenticado.
     * @param {string} userId - ID del usuario proveniente del Token JWT
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
     * Centraliza la firma de JWT garantizando seguridad y trazabilidad.
     * @private
     */
    generateToken(user) {
        if (!environment.jwtSecret) {
            throw new Error('Configuración crítica ausente: JWT_SECRET no está definido en las variables de entorno.');
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