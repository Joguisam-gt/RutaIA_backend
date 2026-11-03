// src/config/environment.js
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

/**
 * Clase encargada de gestionar, aislar y validar la configuración de variables de entorno.
 * Aplica el principio SRP (Single Responsibility Principle) al encapsular el contrato de entorno.
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
        N8N_DOCS_WEBHOOK_URL: ''
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
        // Si la variable no pertenece al contrato, se arroja la excepción esperada por las pruebas
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

// Exportación por defecto para mantener compatibilidad con los tests unitarios
export default EnvironmentConfig;

/**
 * Objeto global congelado para acceso directo en servicios y repositorios.
 */
const defaultConfig = new EnvironmentConfig();

export const environment = {
    get port() { return defaultConfig.get('PORT'); },
    get nodeEnv() { return defaultConfig.get('NODE_ENV'); },
    mongo: {
        get uri() { return defaultConfig.get('MONGODB_URI'); },
        get dbName() { return defaultConfig.get('DB_NAME'); }
    },
    get jwtSecret() { return defaultConfig.get('JWT_SECRET'); },
    n8n: {
        get chatWebhookUrl() { return defaultConfig.get('N8N_CHAT_WEBHOOK_URL'); },
        get docsWebhookUrl() { return defaultConfig.get('N8N_DOCS_WEBHOOK_URL'); }
    }
};