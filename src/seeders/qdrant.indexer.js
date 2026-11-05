// src/seeders/qdrant.indexer.js
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import Database from '../config/database.js';
import { environment } from '../config/environment.js';
import logger from '../utils/logger.js';

dotenv.config();

const QDRANT_URL = (environment.qdrantUrl || 'http://localhost:6333').replace(/\/$/, '');
const COLLECTION_NAME = 'courses';
const VECTOR_SIZE = 768;

/**
 * 1. Generador de Embedding Local determinista de 768 dimensiones
 * Convierte el texto en un vector normalizado compatible con distancia Coseno
 */
function generateLocalVector(text, dimensions = 768) {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector = new Float32Array(dimensions);
    
    for (let i = 0; i < dimensions; i++) {
        // Genera valores normalizados entre -1.0 y 1.0 basados en el contenido del curso
        const byte = hash[i % hash.length];
        vector[i] = ((byte / 255.0) * 2.0 - 1.0) * Math.sin(i + 1);
    }

    // Normalizacion L2 para metrica Coseno (magnitud = 1.0)
    let norm = 0;
    for (let i = 0; i < dimensions; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm);
    for (let i = 0; i < dimensions; i++) vector[i] /= norm;

    return Array.from(vector);
}

/**
 * 2. Verifica o crea la coleccion en Qdrant Local
 */
async function ensureLocalCollection() {
    logger.info(`[Qdrant]: Verificando coleccion '${COLLECTION_NAME}' en ${QDRANT_URL}...`);
    try {
        await axios.get(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
        logger.info(`[Qdrant]: La coleccion '${COLLECTION_NAME}' ya existe.`);
    } catch (error) {
        if (error.response?.status === 404) {
            logger.info(`[Qdrant]: Creando coleccion '${COLLECTION_NAME}' (768 dims, Cosine)...`);
            await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
                vectors: { size: VECTOR_SIZE, distance: 'Cosine' }
            });
            logger.info(`[Qdrant]: Coleccion '${COLLECTION_NAME}' creada exitosamente.`);
        } else {
            throw error;
        }
    }
}

/**
 * 3. Ejecuta la indexacion de los 20 cursos en Qdrant Local
 */
async function runLocalIndexer() {
    try {

        logger.info('[Indexer]: Iniciando Indexacion Vectorial Local (RF 05)');


        await Database.connect();
        const db = Database.getDb();

        await ensureLocalCollection();

        const courses = await db.collection('courses').find({ status: 'ACTIVO' }).toArray();
        if (!courses || courses.length === 0) {
            throw new Error('No se encontraron cursos activos en MongoDB. Ejecute: node src/seeders/db.seeder.js');
        }

        logger.info(`[Indexer]: ${courses.length} cursos encontrados en MongoDB.`);

        const points = [];

        for (const [index, course] of courses.entries()) {
            const textToEmbed = `Curso: ${course.title}. Categoria: ${course.category}. Nivel: ${course.level}. Descripcion: ${course.description}`;

            logger.info(`[Indexer]: [${index + 1}/${courses.length}] Generando vector para: '${course.title}'...`);
            
            // Genera el vector local de 768 flotantes sin depender de APIs externas
            const vector = generateLocalVector(textToEmbed, VECTOR_SIZE);
            const pointId = crypto.randomUUID();

            points.push({
                id: pointId,
                vector: vector,
                payload: {
                    courseId: String(course._id),
                    title: course.title,
                    description: course.description,
                    category: course.category,
                    level: course.level,
                    durationHours: course.durationHours,
                    status: course.status
                }
            });
        }

        logger.info('[Qdrant]: Almacenando puntos vectoriales y payloads en Qdrant Local...');
        await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
            points
        });


        logger.info(`[Indexer]: Proceso completado exitosamente.`);
        logger.info(`[Indexer]: Total de cursos indexados en Qdrant: ${points.length}`);
        logger.info(`[Qdrant]: Revisa tus vectores en: http://localhost:6333/dashboard`);

        process.exit(0);
    } catch (error) {
        logger.error('[Indexer]: Error durante la indexacion:', error.response?.data || error.message);
        process.exit(1);
    }
}

runLocalIndexer();