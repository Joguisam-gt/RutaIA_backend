// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.js'],
        exclude: ['**/node_modules/**', '**/.git/**'],
        env: {
            NODE_ENV: 'test',
            PORT: '4000',
            CORS_ORIGIN: 'http://localhost:3000',
            MONGODB_URI: 'mongodb://localhost:27017',
            MONGODB_DB_NAME: 'rutaia_test_db',
            JWT_SECRET: 'test_jwt_secret_key_super_segura_123456',
            N8N_WEBHOOK_URL_INGEST: 'http://localhost:5678/webhook-test/ingest',
            N8N_WEBHOOK_URL_CHAT: 'http://localhost:5678/webhook-test/chat',
            N8N_SHARED_SECRET: 'test_n8n_shared_secret_key'
        },
        testTimeout: 10000
    }
});