// src/app.js
import express from 'express';
import cors from 'cors';


import router from "./routes/index.js"
const app = express();

// Opciones de CORS flexibles para desarrollo
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como Postman o curl) o presentes en la lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // En desarrollo local aceptamos el origen para evitar bloqueos
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Montaje de rutas
app.use('/api/v1', router);

export default app;