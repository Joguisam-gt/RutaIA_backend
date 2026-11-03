// src/config/environment.js
// Principio SRP (Single Responsibility Principle): Encapsula la lectura, validación y exportación de variables de entorno del sistema.
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env en la raíz del proyecto
dotenv.config();

/**
 * Clase encargada de gestionar, aislar y validar la configuración de variables de entorno.
 */
export class EnvironmentConfig {
  /**
   * Contrato estricto de variables permitidas en la aplicación con sus valores por defecto.
   */
  static CONTRACT = {
    PORT: 3000,
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://localhost:27017',
    DB_NAME: 'rutaia_db',
    JWT_SECRET: 'default_secret',
    N8N_CHAT_WEBHOOK_URL: '',
    N8N_DOCS_WEBHOOK_URL: '',
    N8N_WEBHOOK_URL_INGEST: '',
    N8N_WEBHOOK_URL_CHAT: '',
    N8N_SHARED_SECRET: ''
  };

  /**
   * Recibe un objeto de variables de entorno (por defecto process.env).
   * @param {Object} envData - Diccionario de variables de entorno.
   */
  constructor(envData = process.env) {
    this.env = { ...envData };
  }

  /**
   * Obtiene y valida el valor de una variable declarada en el contrato.
   * @param {string} key - Nombre de la variable de entorno.
   * @returns {string|number} Valor procesado de la variable.
   */
  get(key) {
    // Si la variable no pertenece al contrato, se arroja la excepción requerida por las pruebas unitarias
    if (!(key in EnvironmentConfig.CONTRACT)) {
      throw new Error(`La variable '${key}' no existe`);
    }

    const value = this.env[key] !== undefined ? this.env[key] : EnvironmentConfig.CONTRACT[key];

    // Convierte valores numéricos específicos según el contrato
    if (key === 'PORT') {
      return Number(value);
    }

    return value;
  }
}

// Instancia global por defecto cargada con process.env
const defaultConfig = new EnvironmentConfig();

/**
 * Objeto estructurado de entorno para consumo centralizado en servicios.
 */
export const environment = {
  get port() { return defaultConfig.get('PORT'); },
  get nodeEnv() { return defaultConfig.get('NODE_ENV'); },
  mongo: {
    get uri() { return defaultConfig.get('MONGODB_URI'); },
    get dbName() { return defaultConfig.get('DB_NAME'); }
  },
  get jwtSecret() { return defaultConfig.get('JWT_SECRET'); },
  n8n: {
    get chatWebhookUrl() { return defaultConfig.get('N8N_CHAT_WEBHOOK_URL') || defaultConfig.get('N8N_WEBHOOK_URL_CHAT'); },
    get docsWebhookUrl() { return defaultConfig.get('N8N_DOCS_WEBHOOK_URL') || defaultConfig.get('N8N_WEBHOOK_URL_INGEST'); },
    get sharedSecret() { return defaultConfig.get('N8N_SHARED_SECRET'); }
  }
};

// Exportaciones nombradas individuales para mantener compatibilidad con middlewares y servicios
export const JWT_SECRET = defaultConfig.get('JWT_SECRET');
export const PORT = defaultConfig.get('PORT');
export const NODE_ENV = defaultConfig.get('NODE_ENV');
export const MONGODB_URI = defaultConfig.get('MONGODB_URI');
export const DB_NAME = defaultConfig.get('DB_NAME');

// Constantes completas de Webhooks e integración n8n
export const N8N_CHAT_WEBHOOK_URL = defaultConfig.get('N8N_CHAT_WEBHOOK_URL');
export const N8N_DOCS_WEBHOOK_URL = defaultConfig.get('N8N_DOCS_WEBHOOK_URL');
export const N8N_WEBHOOK_URL_INGEST = defaultConfig.get('N8N_WEBHOOK_URL_INGEST');
export const N8N_WEBHOOK_URL_CHAT = defaultConfig.get('N8N_WEBHOOK_URL_CHAT');
export const N8N_SHARED_SECRET = defaultConfig.get('N8N_SHARED_SECRET');

// Exportación por defecto requerida por las pruebas unitarias
export default EnvironmentConfig;