// Fragmento de conexión en src/config/database.js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Database {
    // ... métodos previos (connect, getInstance, etc.)

    /**
     * Aplica los esquemas JSON de validación a las colecciones correspondientes.
     * @param {Db} db - Instancia de la base de datos MongoDB.
     */
    static async applyJsonSchemas(db) {
        const schemasMap = {
            users: 'user.schema.json',
            courses: 'course.schema.json',
            queries: 'query.schema.json',
            ratings: 'rating.schema.json',
            categories_graph: 'categoryGraph.schema.json'
        };

        for (const [collectionName, schemaFileName] of Object.entries(schemasMap)) {
            try {
                const schemaPath = path.resolve(__dirname, '../schemas', schemaFileName);
                const schemaContent = await fs.readFile(schemaPath, 'utf-8');
                const validatorSchema = JSON.parse(schemaContent);

                // Garantiza la existencia de la colección antes de aplicar la validación
                const collections = await db.listCollections({ name: collectionName }).toArray();
                if (collections.length === 0) {
                    await db.createCollection(collectionName);
                }

                // Aplica o actualiza la regla $jsonSchema en modo estricto
                await db.command({
                    collMod: collectionName,
                    validator: validatorSchema,
                    validationLevel: 'strict',
                    validationAction: 'error'
                });

                logger.info(`Validator $jsonSchema aplicado correctamente a la colección: ${collectionName}`);
            } catch (error) {
                logger.error(`Error al aplicar el esquema JSON en ${collectionName}:`, error.message);
            }
        }
    }
}



