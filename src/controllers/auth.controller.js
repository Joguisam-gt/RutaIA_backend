// Principio SRP: Controla la verificación y autenticación de usuarios.
import { database } from '../config/database.js';
import { AppError } from '../errors/appError.js';

export class AuthController {
    /**
     * Obtiene la información del usuario autenticado actual a partir del token del middleware.
     */
    getMe = async (req, res, next) => {
        try {
            const db = database.getDb();
            const userId = req.user?.id;

            if (!userId) {
                throw new AppError('No autenticado', 401);
            }

            // Consulta nativa utilizando MongoClient
            const user = await db.collection('users').findOne(
                { _id: userId },
                { projection: { password: 0 } }
            );

            if (!user) {
                throw new AppError('Usuario no encontrado', 404);
            }

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    };
}

export default AuthController;