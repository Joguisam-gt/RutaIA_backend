// src/config/environment.js
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rutaia';
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'rutaia';
export const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
export const N8N_WEBHOOK_URL_INGEST = process.env.N8N_WEBHOOK_INGEST_URL || process.env.N8N_WEBHOOK_URL_INGEST || '';
export const N8N_WEBHOOK_URL_CHAT = process.env.N8N_WEBHOOK_URL_CHAT || process.env.N8N_CHAT_WEBHOOK_URL || '';
export const N8N_CHAT_WEBHOOK_URL = N8N_WEBHOOK_URL_CHAT;
export const N8N_SHARED_SECRET = process.env.N8N_SHARED_SECRET || 'secret_key_default';
export const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
export const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

export const environment = {
  port: PORT,
  // Propiedades planas
  mongoUri: MONGO_URI,
  mongoDbName: MONGO_DB_NAME,
  jwtSecret: JWT_SECRET,
  n8nWebhookUrl: N8N_WEBHOOK_URL_INGEST,
  n8nWebhookChatUrl: N8N_WEBHOOK_URL_CHAT,
  n8nChatWebhookUrl: N8N_CHAT_WEBHOOK_URL,
  n8nSharedSecret: N8N_SHARED_SECRET,
  qdrantUrl: QDRANT_URL,
  qdrantApiKey: QDRANT_API_KEY,

  // Propiedades anidadas requeridas por database.js y server.js
  mongo: {
    uri: MONGO_URI,
    dbName: MONGO_DB_NAME
  },
  n8n: {
    chatWebhookUrl: N8N_CHAT_WEBHOOK_URL,
    ingestWebhookUrl: N8N_WEBHOOK_URL_INGEST,
    sharedSecret: N8N_SHARED_SECRET
  }
};

export default environment;