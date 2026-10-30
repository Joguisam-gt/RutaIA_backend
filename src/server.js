import Database from './config/database.js';
import DatabaseIndexer from './config/databaseIndexer.js';
import app from './app.js';
import { PORT } from './config/environment.js';
import logger from './utils/logger.js';

async function startServer() {
    try {
        await Database.connect();
        await Database.applyJsonSchemas();
        await DatabaseIndexer.applyIndexes(); // Aplicar estrategia NoSQL de índices

        app.listen(PORT, () => {
            logger.info(`Servidor escuchando en el puerto ${PORT}`);
        });
    } catch (error) {
        logger.error('Falla crítica al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

startServer();