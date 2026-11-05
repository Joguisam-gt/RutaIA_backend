// src/seeders/db.seeder.js
import { ObjectId, Int32 } from 'mongodb';
import bcrypt from 'bcryptjs';
import Database from '../config/database.js';
import logger from '../utils/logger.js';

const SEED_PASSWORD = 'Password123!';

export async function runSeeder() {
    try {
        logger.info('====================================================');
        logger.info('🌱 Ejecutando Seeder Oficial con Validación JSON Schema');
        logger.info('====================================================');

        await Database.connect();
        const db = Database.getDb();

        // 1. Limpieza de colecciones
        const collections = ['users', 'courses', 'categories', 'queries', 'recommendations', 'ratings', 'metrics'];
        for (const col of collections) {
            await db.collection(col).deleteMany({});
        }

        const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
        const now = new Date();

        // =========================================================================
        // 2. CREACIÓN DE 5 CATEGORÍAS ACADÉMICAS
        // =========================================================================
        const categoryData = [
            { name: 'Desarrollo Web', description: 'Cursos de desarrollo Frontend, Backend y Fullstack.' },
            { name: 'Inteligencia Artificial', description: 'Modelos LLM, RAG, búsqueda semántica y machine learning.' },
            { name: 'Bases de Datos', description: 'Bases de datos relacionales, NoSQL, modelado y optimización.' },
            { name: 'Programación', description: 'Fundamentos, estructuras de datos y lenguajes de programación.' },
            { name: 'Automatización y Datos', description: 'Flujos con n8n, análisis con Python, cloud y DevOps.' }
        ];

        const categories = categoryData.map(c => ({
            _id: new ObjectId(),
            name: c.name,
            description: c.description,
            createdAt: now,
            updatedAt: now
        }));
        await db.collection('categories').insertMany(categories);

        // =========================================================================
        // 3. CREACIÓN DE 10 ESTUDIANTES + 1 ADMIN (Cumple user.schema.json)
        // =========================================================================
        const adminUser = {
            _id: new ObjectId(),
            name: 'Prof. Guillermo Samcam',
            email: 'admin@rutaia.edu',
            password: hashedPassword,
            role: 'admin',
            level: 'AVANZADO', // Enum en mayúsculas
            areaOfInterest: 'Arquitectura de Software e IA',
            createdAt: now,
            updatedAt: now
        };

        const studentData = [
            { name: 'José Rodríguez', email: 'jose.rodriguez@rutaia.edu', level: 'AVANZADO', areaOfInterest: 'Inteligencia Artificial' },
            { name: 'María Gómez', email: 'maria.gomez@rutaia.edu', level: 'PRINCIPIANTE', areaOfInterest: 'Desarrollo Web' },
            { name: 'Carlos López', email: 'carlos.lopez@rutaia.edu', level: 'INTERMEDIO', areaOfInterest: 'Bases de Datos' },
            { name: 'Ana Martínez', email: 'ana.martinez@rutaia.edu', level: 'PRINCIPIANTE', areaOfInterest: 'Automatización y Datos' },
            { name: 'Luis Fernández', email: 'luis.fernandez@rutaia.edu', level: 'INTERMEDIO', areaOfInterest: 'Desarrollo Web' },
            { name: 'Laura Torres', email: 'laura.torres@rutaia.edu', level: 'AVANZADO', areaOfInterest: 'Inteligencia Artificial' },
            { name: 'Javier Ramírez', email: 'javier.ramirez@rutaia.edu', level: 'PRINCIPIANTE', areaOfInterest: 'Programación' },
            { name: 'Sofía Díaz', email: 'sofia.diaz@rutaia.edu', level: 'INTERMEDIO', areaOfInterest: 'Bases de Datos' },
            { name: 'Diego Morales', email: 'diego.morales@rutaia.edu', level: 'AVANZADO', areaOfInterest: 'Programación' },
            { name: 'Elena Castro', email: 'elena.castro@rutaia.edu', level: 'PRINCIPIANTE', areaOfInterest: 'Automatización y Datos' }
        ];

        const studentDocs = studentData.map(st => ({
            _id: new ObjectId(),
            name: st.name,
            email: st.email,
            password: hashedPassword,
            role: 'student',
            level: st.level,
            areaOfInterest: st.areaOfInterest,
            createdAt: now,
            updatedAt: now
        }));

        await db.collection('users').insertMany([adminUser, ...studentDocs]);

        // =========================================================================
        // 4. CREACIÓN DE EXACTAMENTE 20 CURSOS (Cumple course.schema.json)
        // =========================================================================
        const coursesData = [
            // Desarrollo Web (4 cursos)
            {
                title: 'Desarrollo Web Frontend con React y Next.js',
                description: 'Aprende a construir aplicaciones frontend dinámicas, componentes reutilizables, hooks avanzados, Server-Side Rendering (SSR) y gestión de estado moderna.',
                category: 'Desarrollo Web',
                level: 'INTERMEDIO',
                durationHours: 40
            },
            {
                title: 'Arquitectura de Backend con Node.js y Express',
                description: 'Diseño e implementación de APIs REST escalables, arquitectura en capas, autenticación con JWT, middlewares, validaciones y manejo global de excepciones.',
                category: 'Desarrollo Web',
                level: 'INTERMEDIO',
                durationHours: 45
            },
            {
                title: 'Fundamentos de HTML5, CSS3 Moderno y Flexbox',
                description: 'Maquetación web profesional, diseño responsive adaptable a móviles, animaciones CSS, semántica accesible y estándares web modernos.',
                category: 'Desarrollo Web',
                level: 'PRINCIPIANTE',
                durationHours: 25
            },
            {
                title: 'Arquitectura Frontend Avanzada y Microfrontends',
                description: 'Patrones de arquitectura para aplicaciones cliente a gran escala, microfrontends con Module Federation, optimización de bundles y performance.',
                category: 'Desarrollo Web',
                level: 'AVANZADO',
                durationHours: 50
            },

            // Inteligencia Artificial (4 cursos)
            {
                title: 'Introducción a la Inteligencia Artificial y Machine Learning',
                description: 'Conceptos fundamentales de la IA, algoritmos de aprendizaje supervisado y no supervisado, regresión, clasificación y redes neuronales básicas.',
                category: 'Inteligencia Artificial',
                level: 'PRINCIPIANTE',
                durationHours: 30
            },
            {
                title: 'Arquitectura RAG y Búsqueda Semántica con Qdrant',
                description: 'Construcción de sistemas de Generación Aumentada por Recuperación (RAG), embeddings vectoriales con Gemini, colecciones en Qdrant y similitud de coseno.',
                category: 'Inteligencia Artificial',
                level: 'AVANZADO',
                durationHours: 50
            },
            {
                title: 'Ingeniería de Prompts y Modelos LLM con Gemini',
                description: 'Diseño y optimización de prompts para modelos fundacionales, técnicas de Few-Shot prompting, prevención de alucinaciones y llamadas a funciones de IA.',
                category: 'Inteligencia Artificial',
                level: 'INTERMEDIO',
                durationHours: 35
            },
            {
                title: 'Desarrollo de Agentes de IA Autónomos con LangChain',
                description: 'Creación de agentes inteligentes capaces de utilizar herramientas externas, memoria conversacional, razonamiento multi-paso y automatización con LLMs.',
                category: 'Inteligencia Artificial',
                level: 'AVANZADO',
                durationHours: 55
            },

            // Bases de Datos (4 cursos)
            {
                title: 'Diseño y Modelado de Bases de Datos NoSQL con MongoDB',
                description: 'Modelado documental, validadores JSON Schema, indexación avanzada, pipeline de agregación, transacciones ACID y buenas prácticas de escalabilidad.',
                category: 'Bases de Datos',
                level: 'INTERMEDIO',
                durationHours: 40
            },
            {
                title: 'Bases de Datos Relacionales y SQL Profesional',
                description: 'Diseño entidad-relación normalizado, consultas complejas con JOINs, llaves foráneas, transacciones, vistas y optimización de motores relacionales.',
                category: 'Bases de Datos',
                level: 'PRINCIPIANTE',
                durationHours: 35
            },
            {
                title: 'Optimización de Consultas y Tuning en MongoDB',
                description: 'Análisis de planes de ejecución con explain, estrategias de sharding, índices compuestos y caché para bases de datos documentales de alto tráfico.',
                category: 'Bases de Datos',
                level: 'AVANZADO',
                durationHours: 45
            },
            {
                title: 'Bases de Datos Vectoriales y Grafos de Conocimiento',
                description: 'Almacenamiento de vectores en alta dimensión, indexación HNSW en Qdrant y modelado de grafos para sistemas de recomendación contextual.',
                category: 'Bases de Datos',
                level: 'AVANZADO',
                durationHours: 50
            },

            // Programación (4 cursos)
            {
                title: 'Fundamentos de Programación con Python',
                description: 'Iniciación a la programación desde cero con Python: sintaxis limpia, estructuras de control, listas, diccionarios y programación orientada a objetos.',
                category: 'Programación',
                level: 'PRINCIPIANTE',
                durationHours: 30
            },
            {
                title: 'JavaScript Asíncrono y Patrones de Diseño',
                description: 'Dominio del Event Loop, Promises, Async/Await, closures y aplicación de patrones creacionales, estructurales y de comportamiento en JavaScript moderno.',
                category: 'Programación',
                level: 'INTERMEDIO',
                durationHours: 35
            },
            {
                title: 'TypeScript para Aplicaciones Empresariales',
                description: 'Tipado estático en JavaScript, interfaces, genéricos avanzados, decoradores y arquitectura de software limpia en entornos empresariales.',
                category: 'Programación',
                level: 'INTERMEDIO',
                durationHours: 40
            },
            {
                title: 'Estructuras de Datos y Algoritmos Avanzados',
                description: 'Árboles binarios, grafos, tablas hash, algoritmos de ordenamiento, complejidad temporal Big-O y resolución de problemas para entrevistas técnicas.',
                category: 'Programación',
                level: 'AVANZADO',
                durationHours: 60
            },

            // Automatización y Datos (4 cursos)
            {
                title: 'Automatización de Flujos de Trabajo con n8n',
                description: 'Diseño de flujos automatizados de extremo a extremo, webhooks, orquestación de servicios en la nube, consumo de APIs y conexión con modelos de IA.',
                category: 'Automatización y Datos',
                level: 'PRINCIPIANTE',
                durationHours: 25
            },
            {
                title: 'Análisis de Datos y Visualización con Pandas y Python',
                description: 'Limpieza, transformación, exploración y visualización de grandes conjuntos de datos estructurados utilizando NumPy, Pandas, Matplotlib y Seaborn.',
                category: 'Automatización y Datos',
                level: 'INTERMEDIO',
                durationHours: 40
            },
            {
                title: 'Contenedores y Microservicios con Docker y Kubernetes',
                description: 'Creación de imágenes optimizadas con Docker, Docker Compose, orquestación de clústeres con Kubernetes y despliegues seguros en producción.',
                category: 'Automatización y Datos',
                level: 'AVANZADO',
                durationHours: 50
            },
            {
                title: 'DevOps y Pipelines de Integración Continua (CI/CD)',
                description: 'Automatización de compilación, pruebas unitarias automatizadas y despliegue continuo mediante GitHub Actions y monitoreo de servidores.',
                category: 'Automatización y Datos',
                level: 'INTERMEDIO',
                durationHours: 35
            }
        ];

        const courseDocs = coursesData.map(c => ({
            _id: new ObjectId(),
            title: c.title,
            description: c.description,
            category: c.category,
            level: c.level,
            durationHours: c.durationHours,
            status: 'ACTIVO',
            isVisible: true,
            createdAt: now,
            updatedAt: now
        }));

        await db.collection('courses').insertMany(courseDocs);

        // =========================================================================
        // 5. CREACIÓN DE 6 CONSULTAS (Cumple query.schema.json)
        // =========================================================================
        const feedbackSeedData = [
            {
                studentIndex: 0,
                courseIndex: 5,
                query: '¿Qué curso me recomiendas para implementar búsqueda semántica con vectores?',
                aiResponse: 'Te recomendamos el curso "Arquitectura RAG y Búsqueda Semántica con Qdrant", ya que profundiza en embeddings vectoriales y similitud de coseno.',
                score: 5,
                comment: 'Excelente recomendación de la IA, justo el curso que buscaba.'
            },
            {
                studentIndex: 1,
                courseIndex: 0,
                query: 'Quiero aprender a hacer páginas web interactivas con React.',
                aiResponse: 'El curso ideal para tu objetivo es "Desarrollo Web Frontend con React y Next.js", donde aprenderás componentes y hooks modernos.',
                score: 5,
                comment: 'Muy acertada la recomendación, el contenido se adapta perfecto a mi nivel.'
            },
            {
                studentIndex: 2,
                courseIndex: 8,
                query: 'Necesito aprender a modelar datos no relacionales y hacer agregaciones.',
                aiResponse: 'Te sugerimos el curso "Diseño y Modelado de Bases de Datos NoSQL con MongoDB", centrado en esquemas JSON y agregaciones.',
                score: 4,
                comment: 'Buena recomendación, me sirvió mucho la sugerencia.'
            },
            {
                studentIndex: 3,
                courseIndex: 16,
                query: '¿Tienen algún curso para automatizar tareas repetitivas conectando APIs?',
                aiResponse: 'Te recomendamos "Automatización de Flujos de Trabajo con n8n", donde aprenderás a orquestar webhooks y servicios cloud sin programar en exceso.',
                score: 5,
                comment: 'La IA entendió exactamente mi necesidad.'
            },
            {
                studentIndex: 4,
                courseIndex: 1,
                query: 'Quiero construir APIs REST seguras con autenticación JWT.',
                aiResponse: 'Para tu interés en desarrollo backend, el curso "Arquitectura de Backend con Node.js y Express" cubre JWT, middlewares y arquitectura limpia.',
                score: 4,
                comment: 'Recomendación muy precisa y fundamentada.'
            },
            {
                studentIndex: 5,
                courseIndex: 7,
                query: 'Deseo crear agentes de Inteligencia Artificial que ejecuten herramientas externas.',
                aiResponse: 'Te recomendamos el curso avanzado "Desarrollo de Agentes de IA Autónomos con LangChain", enfocado en razonamiento multi-paso y herramientas.',
                score: 5,
                comment: 'La mejor sugerencia que me ha dado una IA académica.'
            }
        ];

        const queriesToInsert = [];
        const ratingsToInsert = [];
        const recommendationsToInsert = [];

        for (const item of feedbackSeedData) {
            const student = studentDocs[item.studentIndex];
            const course = courseDocs[item.courseIndex];

            const queryId = new ObjectId();
            const recId = new ObjectId();

            // Cumple query.schema.json: studentId (ObjectId), userQuery (string), status (enum)
            queriesToInsert.push({
                _id: queryId,
                studentId: student._id, // Tipo ObjectId estricto
                userQuery: item.query,  // Nombre exacto del esquema
                status: 'RESPONDIDA',   // Enum en mayúsculas
                aiResponse: item.aiResponse,
                vectorSources: [
                    {
                        courseId: course._id,
                        title: course.title,
                        category: course.category,
                        similarity: 0.89
                    }
                ],
                similarityScore: 0.89,
                recommendedCourseIds: [course._id],
                createdAt: now,
                updatedAt: now
            });

            // Cumple rating.schema.json: courseId (ObjectId), studentId (ObjectId), score (Int)
            ratingsToInsert.push({
                _id: new ObjectId(),
                courseId: course._id,   // Tipo ObjectId estricto
                studentId: student._id, // Tipo ObjectId estricto
                score: new Int32(item.score), // Tipo int de BSON
                comment: item.comment,
                createdAt: now
            });

            // Recomendación auxiliar para trazabilidad
            recommendationsToInsert.push({
                _id: recId,
                queryId: String(queryId),
                studentId: String(student._id),
                answer: item.aiResponse,
                sources: [
                    {
                        courseId: String(course._id),
                        title: course.title,
                        category: course.category,
                        similarity: 0.89
                    }
                ],
                status: 'RESPONDIDA',
                createdAt: now
            });
        }

        await db.collection('queries').insertMany(queriesToInsert);
        await db.collection('ratings').insertMany(ratingsToInsert);
        await db.collection('recommendations').insertMany(recommendationsToInsert);

        // =========================================================================
        // RESUMEN CONSOLIDADO
        // =========================================================================
        
        logger.info('SEEDER EJECUTADO CON ÉXITO:');
        logger.info(`Estudiantes: ${studentDocs.length} (+ 1 Administrador)`);
        logger.info(`Cursos Creados: ${courseDocs.length}`);
        logger.info(`Categorías Creadas: ${categories.length}`);
        logger.info(`Calificaciones Registradas: ${ratingsToInsert.length}`);
        logger.info(`Consultas Registradas: ${queriesToInsert.length}`);
        logger.info('Admin: admin@rutaia.edu | Password: Password123!');
        logger.info('Estudiante de prueba: jose.rodriguez@rutaia.edu | Password: Password123!');

        process.exit(0);
    } catch (error) {
        logger.error('Error fatal corriendo el seeder:', error);
        process.exit(1);
    }
}

runSeeder();