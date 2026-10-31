import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnvironmentValidator {
    static validate(schema, envSource = process.env) {
        const parsedConfig = {};
        const missingVars = [];
        const typeErrors = [];

        for (const rule of schema) {
            const rawValue = envSource[rule.key];
            const value = (rawValue !== undefined && rawValue !== '') ? rawValue : rule.defaultValue;

            if (rule.required && (value === undefined || value === '')) {
                missingVars.push(rule.key);
                continue;
            }

            if (value !== undefined) {
                switch (rule.type) {
                    case 'number': {
                        const numericValue = Number(value);
                        if (Number.isNaN(numericValue)) {
                            typeErrors.push(`${rule.key}: Se esperaba 'number', se recibió '${value}'`);
                        } else {
                            parsedConfig[rule.key] = numericValue;
                        }
                        break;
                    }
                    case 'boolean': {
                        const strVal = String(value).toLowerCase().trim();
                        if (strVal === 'true' || strVal === '1') parsedConfig[rule.key] = true;
                        else if (strVal === 'false' || strVal === '0') parsedConfig[rule.key] = false;
                        else typeErrors.push(`${rule.key}: Se esperaba 'boolean', se recibió '${value}'`);
                        break;
                    }
                    case 'string':
                    default:
                        parsedConfig[rule.key] = String(value).trim();
                        break;
                }
            }
        }

        if (missingVars.length > 0 || typeErrors.length > 0) {
            console.error('\n [Falla Crítica] Configuración del Servidor Inválida:');
            if (missingVars.length > 0) console.error(` - Faltantes: ${missingVars.join(', ')}`);
            if (typeErrors.length > 0) console.error(` - Tipos inválidos:\n   * ${typeErrors.join('\n   * ')}`);
            process.exit(1);
        }

        return parsedConfig;
    }
}

export class EnvironmentConfig {
    #config;

    constructor(envPath = path.resolve(__dirname, '../../.env')) {
        dotenv.config({ path: envPath });

        const schema = [
            { key: 'PORT', type: 'number', required: false, defaultValue: 3000 },
            { key: 'NODE_ENV', type: 'string', required: false, defaultValue: 'development' },
            { key: 'CORS_ORIGIN', type: 'string', required: true },
            { key: 'MONGODB_URI', type: 'string', required: true },
            { key: 'MONGODB_DB_NAME', type: 'string', required: true },
            { key: 'JWT_SECRET', type: 'string', required: true },
            { key: 'N8N_WEBHOOK_URL_INGEST', type: 'string', required: true },
            { key: 'N8N_WEBHOOK_URL_CHAT', type: 'string', required: true },
            { key: 'N8N_SHARED_SECRET', type: 'string', required: true }
        ];

        const validatedValues = EnvironmentValidator.validate(schema, process.env);
        this.#config = Object.freeze(validatedValues);
    }

    get(key) {
        if (!(key in this.#config)) {
            throw new Error(`La variable '${key}' no existe en el contrato de entorno.`);
        }
        return this.#config[key];
    }

    getAll() {
        return { ...this.#config };
    }
}

export const environmentConfigInstance = new EnvironmentConfig();

export const PORT = environmentConfigInstance.get('PORT');
export const NODE_ENV = environmentConfigInstance.get('NODE_ENV');
export const CORS_ORIGIN = environmentConfigInstance.get('CORS_ORIGIN');
export const MONGODB_URI = environmentConfigInstance.get('MONGODB_URI');
export const MONGODB_DB_NAME = environmentConfigInstance.get('MONGODB_DB_NAME');
export const JWT_SECRET = environmentConfigInstance.get('JWT_SECRET');
export const N8N_WEBHOOK_URL_INGEST = environmentConfigInstance.get('N8N_WEBHOOK_URL_INGEST');
export const N8N_WEBHOOK_URL_CHAT = environmentConfigInstance.get('N8N_WEBHOOK_URL_CHAT');
export const N8N_SHARED_SECRET = environmentConfigInstance.get('N8N_SHARED_SECRET');