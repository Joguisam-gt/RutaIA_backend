// src/config/environment.js
const path = require('path');
const dotenv = require('dotenv');

/**
 * Clase encargada de ejecutar las reglas de validación de tipos y presencia (SRP).
 */
class EnvironmentValidator {
    /**
     * Valida un conjunto de definiciones contra el objeto de entorno provisto.
     * @param {Array<Object>} schema - Definición de variables requeridas.
     * @param {Object} envSource - Fuente de datos (ej. process.env).
     * @returns {Object} Configuración parseada y tipada.
     */
    static validate(schema, envSource = process.env) {
        const parsedConfig = {};
        const missingVars = [];
        const typeErrors = [];

        for (const rule of schema) {
            const rawValue = envSource[rule.key];
            const value = (rawValue !== undefined && rawValue !== '') ? rawValue : rule.defaultValue;

            // 1. Verificación de Presencia
            if (rule.required && (value === undefined || value === '')) {
                missingVars.push(rule.key);
                continue;
            }

            // 2. Verificación y Conversión de Tipos
            if (value !== undefined) {
                switch (rule.type) {
                    case 'number': {
                        const numericValue = Number(value);
                        if (Number.isNaN(numericValue)) {
                            typeErrors.push(`${rule.key}: Se esperaba tipo 'number', se recibió '${value}'`);
                        } else {
                            parsedConfig[rule.key] = numericValue;
                        }
                        break;
                    }
                    case 'boolean': {
                        const strVal = String(value).toLowerCase().trim();
                        if (strVal === 'true' || strVal === '1') {
                            parsedConfig[rule.key] = true;
                        } else if (strVal === 'false' || strVal === '0') {
                            parsedConfig[rule.key] = false;
                        } else {
                            typeErrors.push(`${rule.key}: Se esperaba tipo 'boolean', se recibió '${value}'`);
                        }
                        break;
                    }
                    case 'string':
                    default:
                        parsedConfig[rule.key] = String(value).trim();
                        break;
                }
            }
        }

        // Falla inmediata si existen errores
        if (missingVars.length > 0 || typeErrors.length > 0) {
            console.error('\n [Falla Crítica] Configuración del Servidor Inválida:');
            if (missingVars.length > 0) {
                console.error(` - Variables obligatorias faltantes: ${missingVars.join(', ')}`);
            }
            if (typeErrors.length > 0) {
                console.error(` - Inconsistencias de tipo:\n   * ${typeErrors.join('\n   * ')}`);
            }
            console.error('El servidor se detendrá inmediatamente para prevenir errores en tiempo de ejecución.\n');
            process.exit(1);
        }

        return parsedConfig;
    }
}

/**
 * Clase Singleton para administrar y exponer la configuración inmutable de la aplicación (SRP & OCP).
 */
class EnvironmentConfig {
    #config;

    constructor(envPath = path.resolve(__dirname, '../../.env')) {
        // Carga de archivo .env
        dotenv.config({ path: envPath });

        // Definición estricta de las variables que componen el Puente Express <-> n8n
        const schema = [
            { key: 'PORT', type: 'number', required: false, defaultValue: 3000 },
            { key: 'NODE_ENV', type: 'string', required: false, defaultValue: 'development' },
            { key: 'CORS_ORIGIN', type: 'string', required: true },

            // Persistencia Ligera de Metadata y Usuarios
            { key: 'MONGODB_URI', type: 'string', required: true },
            { key: 'MONGODB_DB_NAME', type: 'string', required: true },
            { key: 'JWT_SECRET', type: 'string', required: true },

            // Endpoints y Autenticación del Puente con n8n (Cerebro de IA)
            { key: 'N8N_WEBHOOK_URL_INGEST', type: 'string', required: true },
            { key: 'N8N_WEBHOOK_URL_CHAT', type: 'string', required: true },
            { key: 'N8N_SHARED_SECRET', type: 'string', required: true }
        ];

        // Ejecuta la validación y encapsula el resultado
        const validatedValues = EnvironmentValidator.validate(schema, process.env);
        this.#config = Object.freeze(validatedValues);
    }

    /**
     * Obtiene el valor asignado a una variable de entorno validada.
     * @param {string} key
     * @returns {string|number|boolean}
     */
    get(key) {
        if (!(key in this.#config)) {
            throw new Error(`La variable '${key}' no está definida en el contrato de variables de entorno.`);
        }
        return this.#config[key];
    }

    /**
     * Retorna una copia congelada de toda la configuración.
     * @returns {Object}
     */
    getAll() {
        return { ...this.#config };
    }
}

// Instanciación del Singleton de Configuración
const environmentConfigInstance = new EnvironmentConfig();

module.exports = {
    PORT: environmentConfigInstance.get('PORT'),
    NODE_ENV: environmentConfigInstance.get('NODE_ENV'),
    CORS_ORIGIN: environmentConfigInstance.get('CORS_ORIGIN'),
    MONGODB_URI: environmentConfigInstance.get('MONGODB_URI'),
    MONGODB_DB_NAME: environmentConfigInstance.get('MONGODB_DB_NAME'),
    JWT_SECRET: environmentConfigInstance.get('JWT_SECRET'),
    N8N_WEBHOOK_URL_INGEST: environmentConfigInstance.get('N8N_WEBHOOK_URL_INGEST'),
    N8N_WEBHOOK_URL_CHAT: environmentConfigInstance.get('N8N_WEBHOOK_URL_CHAT'),
    N8N_SHARED_SECRET: environmentConfigInstance.get('N8N_SHARED_SECRET'),
    environmentConfigInstance
};