// Principio SRP y DIP: Administra la conexión nativa con MongoClient y provee acceso a la base de datos sin acoplar detalles de implementación a la capa de repositorio.
import { MongoClient } from 'mongodb';
import { environment } from './environment.js';
import { logger } from '../utils/logger.js';

class Database {
  constructor() {
    // Instancia única del cliente nativo de MongoDB (Singleton)
    this.client = null;
    this.db = null;
  }

  /**
   * Inicializa la conexión a la base de datos utilizando el pool nativo de MongoClient.
   */
  async connect() {
    // Si ya existe una conexión activa, reutiliza la instancia para evitar sobrecargar el pool
    if (this.db) {
      return this.db;
    }

    try {
      // Creación del cliente nativo con configuraciones de conexión optimizadas
      this.client = new MongoClient(environment.mongo.uri, {
        maxPoolSize: 10, // Límite máximo de conexiones concurrentes en el pool
        serverSelectionTimeoutMS: 5000, // Timeout de selección de servidor
      });

      // Establece la conexión con el clúster/servidor MongoDB
      await this.client.connect();
      this.db = this.client.db(environment.mongo.dbName);

      logger.info(`Conexión exitosa a la base de datos MongoDB: ${environment.mongo.dbName}`);
      return this.db;
    } catch (error) {
      logger.error('Error al conectar con la base de datos MongoDB:', error);
      throw error;
    }
  }

  /**
   * Obtiene la instancia actual de la base de datos.
   */
  getDb() {
    if (!this.db) {
      throw new Error('La base de datos no ha sido inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  /**
   * Cierra de forma limpia la conexión del cliente MongoDB.
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.db = null;
      this.client = null;
      logger.info('Conexión con MongoDB cerrada correctamente.');
    }
  }
}

// Exporta una única instancia para garantizar el patrón Singleton en toda la aplicación
export const database = new Database();