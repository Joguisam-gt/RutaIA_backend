// tests/unit/enviroment.test.js
import { describe, it, expect } from 'vitest';
import { EnvironmentConfig } from '../../src/config/environment.js';

describe('EnvironmentConfig Unit Tests', () => {
    it('Debe cargar y validar las variables de entorno correctamente', () => {
        const mockEnv = {
            PORT: '4000',
            NODE_ENV: 'test',
            CORS_ORIGIN: 'http://localhost:3000',
            MONGODB_URI: 'mongodb://localhost:27017',
            MONGODB_DB_NAME: 'test_db',
            JWT_SECRET: 'test_secret',
            N8N_WEBHOOK_URL_INGEST: 'http://n8n/ingest',
            N8N_WEBHOOK_URL_CHAT: 'http://n8n/chat',
            N8N_SHARED_SECRET: 'n8n_secret'
        };

        const envConfig = new EnvironmentConfig(mockEnv);
        expect(envConfig.get('PORT')).toBe(4000);
        expect(envConfig.get('NODE_ENV')).toBe('test');
    });

    it('Debe arrojar error si se consulta una variable no declarada en el contrato', () => {
        const envConfig = new EnvironmentConfig({
            CORS_ORIGIN: 'http://localhost:3000',
            MONGODB_URI: 'mongodb://localhost:27017',
            MONGODB_DB_NAME: 'test_db',
            JWT_SECRET: 'test_secret',
            N8N_WEBHOOK_URL_INGEST: 'http://n8n/ingest',
            N8N_WEBHOOK_URL_CHAT: 'http://n8n/chat',
            N8N_SHARED_SECRET: 'n8n_secret'
        });

        expect(() => envConfig.get('VAR_INEXISTENTE')).toThrow("La variable 'VAR_INEXISTENTE' no existe");
    });
});