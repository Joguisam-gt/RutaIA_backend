// src/services/instructor.service.js
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';
import { environment } from '../config/environment.js';
import AppError from '../errors/appError.js';

export default class InstructorService {
    async getDashboardMetrics() {
        const db = Database.getDb();
        const totalStudents = await db.collection('users').countDocuments({ role: 'student' });
        const totalCourses = await db.collection('courses').countDocuments({ status: 'ACTIVO' });
        const totalEnrollments = await db.collection('enrollments').countDocuments();
        const certificatesIssued = await db.collection('certificates').countDocuments();

        const recentActivity = [
            { id: 1, type: 'ENROLLMENT', user: 'José Rodríguez', course: 'Node.js Avanzado', time: 'Hace 10 min' },
            { id: 2, type: 'COMPLETION', user: 'María Gómez', course: 'React Masterclass', time: 'Hace 45 min' },
            { id: 3, type: 'RATING', user: 'Carlos López', course: 'SQL Pro', rating: 5, time: 'Hace 2 horas' }
        ];

        return {
            metrics: {
                totalStudents,
                totalCourses,
                totalEnrollments,
                certificatesIssued,
                totalEarnings: 12480,
                monthlyGrowth: '+14.5%'
            },
            earningsData: [
                { month: 'Ene', amount: 1800 },
                { month: 'Feb', amount: 2400 },
                { month: 'Mar', amount: 3100 },
                { month: 'Abr', amount: 2800 },
                { month: 'May', amount: 3800 }
            ],
            coursePerformance: [
                { id: 'c1', title: 'Node.js Avanzado', studentsCount: 42, rating: 4.9, earnings: 4200 },
                { id: 'c2', title: 'React Masterclass', studentsCount: 38, rating: 4.8, earnings: 3800 },
                { id: 'c3', title: 'Fine-Tuning LLMs', studentsCount: 29, rating: 5.0, earnings: 4480 }
            ],
            recentActivity
        };
    }

    async getStudentsRealtime() {
        const db = Database.getDb();
        const students = await db.collection('users').find({ role: 'student' }).toArray();
        const enrollments = await db.collection('enrollments').find().toArray();
        const metrics = await db.collection('metrics').find().toArray();

        return students.map(st => {
            const stEnrollments = enrollments.filter(e => String(e.studentId) === String(st._id));
            const stMetric = metrics.find(m => String(m.studentId) === String(st._id));
            const completedCount = stEnrollments.filter(e => e.status === 'COMPLETADO').length;

            return {
                id: String(st._id),
                name: st.name,
                email: st.email,
                level: st.level || 'PRINCIPIANTE',
                enrolledCoursesCount: stEnrollments.length,
                completedCoursesCount: completedCount,
                totalHoursStudied: stMetric?.totalHours || 0,
                currentStreak: stMetric?.currentStreak || 0,
                status: 'ACTIVO',
                lastActive: 'Hoy'
            };
        });
    }

    async getQdrantKnowledgeGraph() {
        const db = Database.getDb();
        const categories = await db.collection('categories').find().toArray();
        const courses = await db.collection('courses').find().toArray();

        const nodes = [
            { id: 'root', label: 'RutaIA Qdrant Cluster', type: 'ROOT', group: 'core' }
        ];
        const links = [];

        // 1. Estructura de la BD MongoDB
        categories.forEach((cat) => {
            const catId = `cat-${cat._id}`;
            nodes.push({ id: catId, label: cat.name, type: 'CATEGORY', group: 'category' });
            links.push({ source: 'root', target: catId });

            const catCourses = courses.filter((c) => c.category === cat.name);
            catCourses.forEach((crs) => {
                const crsId = `crs-${crs._id}`;
                nodes.push({ id: crsId, label: crs.title, type: 'COURSE', group: 'course' });
                links.push({ source: catId, target: crsId });
            });
        });

        // 2. Consulta a la API de Qdrant
        try {
            const qdrantHeaders = { 'Content-Type': 'application/json' };
            if (environment.qdrantApiKey) {
                qdrantHeaders['api-key'] = environment.qdrantApiKey;
            }

            const qdrantRes = await fetch(`${environment.qdrantUrl}/collections/rutaia_knowledge_base/points/scroll`, {
                method: 'POST',
                headers: qdrantHeaders,
                body: JSON.stringify({ limit: 50, with_payload: true })
            });

            if (qdrantRes.ok) {
                const qdrantData = await qdrantRes.json();
                const points = qdrantData.result?.points || [];

                points.forEach((point) => {
                    const docId = `qdrant-${point.id}`;
                    const payload = point.payload || {};
                    const title = payload.title || payload.filename || `Vector Chunk #${point.id}`;

                    nodes.push({
                        id: docId,
                        label: title,
                        type: 'DOCUMENT',
                        group: 'qdrant_real',
                        payload
                    });

                    const matchedCourse = courses.find((c) => c.title.toLowerCase().includes((payload.category || '').toLowerCase()));
                    if (matchedCourse) {
                        links.push({ source: `crs-${matchedCourse._id}`, target: docId });
                    } else {
                        links.push({ source: 'root', target: docId });
                    }
                });
            }
        } catch (error) {
            console.warn('Usando estructura base local de Qdrant:', error.message);
        }

        return { nodes, links };
    }

    async triggerN8nIngestion(payload) {
        const webhookUrl = environment?.n8nWebhookUrl || process.env.N8N_WEBHOOK_INGEST_URL;

        if (!webhookUrl) {
            throw new AppError('URL del Webhook de n8n no definida en las variables de entorno.', 500);
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...payload,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`n8n devolvió código de respuesta HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw new AppError(`Fallo de conexión con el flujo de n8n: ${error.message}`, 502);
        }
    }
}