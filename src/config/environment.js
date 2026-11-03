// Principio SRP & OCP: Define el contrato de variables de entorno mediante la clase EnvironmentConfig, permitiendo instanciación para pruebas unitarias y exportación singleton para la aplicación.
import dotenv from 'dotenv';

dotenv.config();

/**
 * Contrato de variables permitidas en la aplicación
 */
const ALLOWED_ENV_KEYS = new Set([
    'PORT',
    'NODE_ENV',
    'MONGODB_URI',
    'DB_NAME',
    'JWT_SECRET',
    'N8N_CHAT_WEBHOOK_URL',
    'N8N_DOCS_WEBHOOK_URL',
    'CORS_ORIGIN',
]);

export class EnvironmentConfig {
    /**
     * Constructor adaptable para inyección de entorno en pruebas
     * @param {Object} envSource - Objeto con variables de entorno (por defecto process.env)
     */
    constructor(envSource = process.env) {
        this.env = envSource;
    }

    /**
     * Obtiene y valida una variable de entorno declarada en el contrato.
     * @param {string} key - Nombre de la variable de entorno
     * @returns {string|number|null} Valor de la variable
     */
    get(key) {
        if (!ALLOWED_ENV_KEYS.has(key)) {
            throw new Error(`La variable de entorno '${key}' no está declarada en el contrato de configuración.`);
        }

        const value = this.env[key];

        if (key === 'PORT') {
            return value ? Number(value) : 3000;
        }

        return value ?? null;
    }
}

// Instancia singleton para uso en el servidor
const defaultEnvConfig = new EnvironmentConfig(process.env);

export const environment = {
    port: defaultEnvConfig.get('PORT'),
    nodeEnv: defaultEnvConfig.get('NODE_ENV') || 'development',
    mongo: {
        uri: defaultEnvConfig.get('MONGODB_URI') || 'mongodb://localhost:27017',
        dbName: defaultEnvConfig.get('DB_NAME') || 'rutaia_db',
    },
    jwtSecret: defaultEnvConfig.get('JWT_SECRET') || 'default_secret',
    n8n: {
        chatWebhookUrl: defaultEnvConfig.get('N8N_CHAT_WEBHOOK_URL') || '',
        docsWebhookUrl: defaultEnvConfig.get('N8N_DOCS_WEBHOOK_URL') || '',
    },
};

export default EnvironmentConfig;