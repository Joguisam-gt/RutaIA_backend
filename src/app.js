// src/app.js
import express from 'express';
import cors from 'cors';

// Importación corregida de rutas
import instructorRoutes from './routes/instructor.routes.js';
import studentRoutes from './routes/student.routes.js';
import courseRoutes from './routes/course.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Montaje de middlewares de rutas
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/courses', courseRoutes);

export default app;