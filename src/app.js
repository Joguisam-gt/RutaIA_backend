// Configuración global de Express con respuesta de estado en la raíz de la API
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import queryRoutes from './routes/query.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de prueba y salud de la API (previene errores 404 al verificar /api/v1)
app.get('/api/v1', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'RutaIA Backend API Proxy',
        version: '1.0.0'
    });
});

// Enrutadores principales
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/queries', queryRoutes);

export default app;