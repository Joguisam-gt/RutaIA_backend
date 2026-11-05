// src/errors/badRequestError.js
import AppError from './appError.js';

export class BadRequestError extends AppError {
    constructor(message = 'Solicitud incorrecta') {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}

export default BadRequestError;