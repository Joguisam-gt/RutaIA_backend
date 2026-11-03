// Principios SOLID: Aplicación del SRP (Single Responsibility Principle) y OCP (Open/Closed Principle)
// Encapsula la gestión del cliente MongoClient y la aplicación delegada de esquemas e índices.
import { MongoClient } from 'mongodb';
import logger from '../utils/logger.js';
import { environment } from './environment.js';
import { initializeDatabaseIndexes } from './databaseIndexer.js';

export class Database {
  constructor() {
    // Instancia del cliente nativo de MongoDB (Singleton)
    this.client = null;
    this.db = null;
  }

  /**
   * Inicializa la conexión con el clúster o servidor local de MongoDB.
   * @returns {Promise<Db>} Instancia de la base de datos conectada.
   */
  async connect() {
    if (this.db) {
      return this.db;
    }

    try {
      this.client = new MongoClient(environment.mongo.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });

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
   * Obtiene la instancia activa de la base de datos.
   */
  getDb() {
    if (!this.db) {
      throw new Error('La base de datos no ha sido inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  /**
   * Aplica los esquemas JSON de validación e índices en las colecciones.
   * Soluciona la llamada requerida en server.js: Database.applyJsonSchemas()
   */
  async applyJsonSchemas() {
    return await initializeDatabaseIndexes();
  }

  /**
   * Método estático para compatibilidad si server.js invoca Database.applyJsonSchemas() como clase.
   */
  static async applyJsonSchemas() {
    return await initializeDatabaseIndexes();
  }

  /**
   * Cierra de forma limpia la conexión MongoClient.
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

// Instancia singleton compartida
export const database = new Database();
export default database;