// src/config/environment.js
import dotenv from 'dotenv';
dotenv.config();

class Environment {
  constructor() {
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.port = Number(process.env.PORT) || 3000;
    
    // Soporte para ambos nombres de variable
    this.mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rutaia';
    this.mongoDbName = process.env.MONGO_DB_NAME || 'rutaia';

    this.jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';

    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_INGEST_URL || process.env.N8N_WEBHOOK_URL_INGEST || '';
    this.n8nChatWebhookUrl = process.env.N8N_WEBHOOK_URL_CHAT || process.env.N8N_CHAT_WEBHOOK_URL || '';
    this.n8nSharedSecret = process.env.N8N_SHARED_SECRET || 'secret_key_default';

    this.qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    this.qdrantApiKey = process.env.QDRANT_API_KEY || '';

    // Agrupacion para clientes
    this.mongo = {
      uri: this.mongoUri,
      dbName: this.mongoDbName
    };

    this.n8n = {
      chatWebhookUrl: this.n8nChatWebhookUrl,
      ingestWebhookUrl: this.n8nWebhookUrl,
      sharedSecret: this.n8nSharedSecret
    };

    Object.freeze(this);
  }
}

export const environment = new Environment();

// Exportaciones individuales para compatibilidad
export const {
  NODE_ENV,
  PORT,
  MONGO_URI,
  MONGO_DB_NAME,
  JWT_SECRET,
  N8N_WEBHOOK_URL_INGEST,
  N8N_WEBHOOK_URL_CHAT,
  N8N_CHAT_WEBHOOK_URL,
  N8N_SHARED_SECRET,
  QDRANT_URL,
  QDRANT_API_KEY
} = {
  NODE_ENV: environment.nodeEnv,
  ...environment
};

export default environment;