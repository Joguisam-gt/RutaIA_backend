
import { MongoClient } from 'mongodb';
import logger from '../utils/logger.js'; // Importación por defecto en lugar de nombrada
import { environment } from './environment.js';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
  }

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

  getDb() {
    if (!this.db) {
      throw new Error('La base de datos no ha sido inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.db = null;
      this.client = null;
      logger.info('Conexión con MongoDB cerrada correctamente.');
    }
  }
}

export const database = new Database();
export default database;