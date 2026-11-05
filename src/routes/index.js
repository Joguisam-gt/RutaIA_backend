// src/routes/index.js
import { Router } from 'express';

// Importación de módulos de rutas del sistema RutaIA
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import queryRoutes from './query.routes.js';
import instructorRoutes from './instructor.routes.js';
import studentRoutes from './student.routes.js';
import ratingRoutes from './rating.routes.js';
import metricRoutes from './metric.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprobación rápida del estado operativo del servidor
 */
router.get('/health', (req, res) => {
    return res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'RutaIA API Gateway'
    });
});

// =========================================================================
// REGISTRO DE RUTAS PRINCIPALES DEL SISTEMA
// =========================================================================

// Autenticación y Cuentas (RF 01)
router.use('/auth', authRoutes);

// Gestión y Catálogo de Cursos (RF 03, RF 04)
router.use('/courses', courseRoutes);

// Consultas Inteligentes y Flujo RAG (RF 06, RF 08, RF 16)
router.use('/queries', queryRoutes);

// Módulo de Instructores / Admin e Ingesta Documental (RF 05)
router.use('/instructor', instructorRoutes);
router.use('/instructors', instructorRoutes); // Alias plural de conveniencia

// Gestión y Perfil de Estudiantes (RF 01, RF 02)
if (studentRoutes) {
    router.use('/students', studentRoutes);
    router.use('/student', studentRoutes);
}

// Calificaciones de Recomendaciones (RF 17)
if (ratingRoutes) {
    router.use('/ratings', ratingRoutes);
}

// Estadísticas y Métricas del Sistema (RF 18)
if (metricRoutes) {
    router.use('/metrics', metricRoutes);
}

// Notificaciones del Sistema
if (notificationRoutes) {
    router.use('/notifications', notificationRoutes);
}

// =========================================================================
// MANEJO DE RUTAS NO ENCONTRADAS DENTRO DE /api/v1
// =========================================================================
router.use('*', (req, res) => {
    return res.status(404).json({
        success: false,
        message: `El endpoint '${req.originalUrl}' no existe en la API de RutaIA.`
    });
});

export default router;