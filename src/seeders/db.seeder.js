// src/seeders/db.seeder.js
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import Database from '../config/database.js';
import logger from '../utils/logger.js';

const SEED_PASSWORD = 'Password123!';

export async function runSeeder() {
    try {
        logger.info('Limpiando base de datos y corriendo nuevo seeder...');
        await Database.connect();
        const db = Database.getDb();

        // 1. Borrar colecciones anteriores
        const collections = [
            'users', 
            'courses', 
            'categories', 
            'category_graph', 
            'levels', 
            'ratings', 
            'enrollments', 
            'metrics', 
            'certificates', 
            'wishlists'
        ];
        for (const col of collections) {
            await db.collection(col).deleteMany({});
        }

        // 2. Insertar Categorías
        const categoryNames = ['Desarrollo Web', 'Inteligencia Artificial', 'Bases de Datos', 'Diseño UX/UI', 'Ciberseguridad'];
        const categories = categoryNames.map((name) => ({
            _id: new ObjectId(),
            name,
            description: `Cursos especializados de ${name}`,
            parentId: null,
            courseIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        await db.collection('categories').insertMany(categories);
        await db.collection('category_graph').insertMany(categories);

        // 3. Insertar Niveles
        const levelNames = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
        const levels = levelNames.map((name, index) => ({
            _id: new ObjectId(),
            name,
            code: name,
            order: index + 1,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        await db.collection('levels').insertMany(levels);

        // 4. Insertar Usuarios (Estudiantes + Admin/Maestro)
        const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

        // Usuario Administrador / Maestro
        const adminUser = {
            _id: new ObjectId(),
            name: 'Prof. Guillermo Samcam',
            email: 'admin.maestro@rutaia.com',
            password: hashedPassword,
            role: 'admin',
            level: 'AVANZADO',
            areaOfInterest: 'Arquitectura de Software e IA',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Lista de Estudiantes
        const studentList = [
            { name: 'José Rodríguez', email: 'jose.rodriguez@rutaia.com', level: 'AVANZADO' },
            { name: 'María Gómez', email: 'maria.gomez@rutaia.com', level: 'PRINCIPIANTE' },
            { name: 'Carlos López', email: 'carlos.lopez@rutaia.com', level: 'INTERMEDIO' },
            { name: 'Ana Martínez', email: 'ana.martinez@rutaia.com', level: 'PRINCIPIANTE' },
            { name: 'Luis Fernández', email: 'luis.fernandez@rutaia.com', level: 'INTERMEDIO' },
            { name: 'Laura Torres', email: 'laura.torres@rutaia.com', level: 'AVANZADO' },
            { name: 'Javier Ramírez', email: 'javier.ramirez@rutaia.com', level: 'PRINCIPIANTE' },
            { name: 'Sofia Díaz', email: 'sofia.diaz@rutaia.com', level: 'INTERMEDIO' },
            { name: 'Diego Morales', email: 'diego.morales@rutaia.com', level: 'AVANZADO' },
            { name: 'Elena Castro', email: 'elena.castro@rutaia.com', level: 'PRINCIPIANTE' }
        ];

        const users = [
            adminUser,
            ...studentList.map((st) => ({
                _id: new ObjectId(),
                name: st.name,
                email: st.email,
                password: hashedPassword,
                role: 'student',
                level: st.level,
                areaOfInterest: 'Tecnología e Inteligencia Artificial',
                createdAt: new Date(),
                updatedAt: new Date()
            }))
        ];

        await db.collection('users').insertMany(users);

        // 5. Insertar Cursos
        const courseTitles = [
            'Node.js Avanzado', 'React Masterclass', 'Python para IA', 'SQL Pro', 'Figma UI/UX',
            'Hacking Ético', 'Microservicios', 'RAG con Qdrant', 'MongoDB Performance', 'UX Research',
            'Tailwind CSS', 'Agentes IA', 'NoSQL Architect', 'Design Systems', 'Redes Seguras',
            'Vitest Testing', 'Fine-Tuning LLMs', 'Cloud DB Admin', 'Usabilidad Web', 'DevSecOps',
            'GraphQL API', 'Docker & Kubernetes'
        ];

        const courseIds = [];
        const courses = courseTitles.map((title, index) => {
            const courseId = new ObjectId();
            courseIds.push(courseId);
            return {
                _id: courseId,
                title,
                description: `Curso práctico y completo sobre ${title} con proyectos reales.`,
                category: categoryNames[index % categoryNames.length],
                level: levelNames[index % levelNames.length],
                durationHours: (index + 1) * 5,
                status: 'ACTIVO',
                isVisible: true,
                averageRating: 5.0,
                totalRatings: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });
        await db.collection('courses').insertMany(courses);

        // Vincular cursos a categorías
        for (let i = 0; i < categories.length; i++) {
            const assignedIds = courseIds.filter((_, idx) => idx % categories.length === i);
            await db.collection('categories').updateOne({ _id: categories[i]._id }, { $set: { courseIds: assignedIds } });
            await db.collection('category_graph').updateOne({ _id: categories[i]._id }, { $set: { courseIds: assignedIds } });
        }

        // 6. Generar Inscripciones, Certificados, Métricas y Favoritos para Estudiantes
        const enrollments = [];
        const metrics = [];
        const certificates = [];
        const wishlists = [];
        const ratings = [];

        const studentUsers = users.filter(u => u.role === 'student');

        studentUsers.forEach((user) => {
            const assignedCourses = [...courseIds].sort(() => 0.5 - Math.random()).slice(0, 3);
            
            assignedCourses.forEach((cId, idx) => {
                const isDone = idx === 0;
                enrollments.push({
                    _id: new ObjectId(),
                    studentId: user._id,
                    courseId: cId,
                    progressPercentage: isDone ? 100 : 50,
                    completedLessons: isDone ? 10 : 5,
                    totalLessons: 10,
                    status: isDone ? 'COMPLETADO' : 'EN_PROGRESO',
                    lastLessonTitle: 'Introducción a Conceptos Clave',
                    lastLessonId: 'less-1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                if (isDone) {
                    const certId = new ObjectId();
                    certificates.push({
                        _id: certId,
                        studentId: user._id,
                        courseId: cId,
                        issueDate: new Date(),
                        credentialId: `CERT-${certId.toString().substring(0, 8).toUpperCase()}`,
                        createdAt: new Date()
                    });
                }
            });

            ratings.push({
                _id: new ObjectId(),
                courseId: assignedCourses[0],
                studentId: user._id,
                score: 5,
                comment: 'Excelente curso, muy recomendado.',
                createdAt: new Date()
            });

            metrics.push({
                _id: new ObjectId(),
                studentId: user._id,
                totalHours: 45,
                certificatesCount: 1,
                currentStreak: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            wishlists.push({
                _id: new ObjectId(),
                studentId: user._id,
                courseIds: [courseIds[5], courseIds[6]],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });

        await db.collection('enrollments').insertMany(enrollments);
        await db.collection('ratings').insertMany(ratings);
        await db.collection('metrics').insertMany(metrics);
        await db.collection('certificates').insertMany(certificates);
        await db.collection('wishlists').insertMany(wishlists);

        logger.info('🎉 Base de datos poblada exitosamente (Incluye Admin/Maestro).');
        process.exit(0);
    } catch (error) {
        logger.error('Error al poblar la base de datos:', error);
        process.exit(1);
    }
}

runSeeder();