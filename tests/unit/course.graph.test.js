// tests/unit/course.graph.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseService from '../../src/services/course.service.js';
import axios from 'axios';

vi.mock('axios');

describe('Endpoint del Grafo de Administrador (Qdrant Graph)', () => {
    let courseService;

    beforeEach(() => {
        vi.clearAllMocks();
        courseService = new CourseService();
    });

    it('Debe transformar los puntos de Qdrant en una estructura de nodos y aristas', async () => {
        axios.post.mockResolvedValue({
            data: {
                result: {
                    points: [
                        {
                            id: 'p1',
                            payload: {
                                courseId: 'c1',
                                title: 'React Masterclass',
                                category: 'Desarrollo Web',
                                level: 'INTERMEDIO',
                                durationHours: 40
                            }
                        },
                        {
                            id: 'p2',
                            payload: {
                                courseId: 'c2',
                                title: 'Node.js Backend',
                                category: 'Desarrollo Web',
                                level: 'INTERMEDIO',
                                durationHours: 35
                            }
                        },
                        {
                            id: 'p3',
                            payload: {
                                courseId: 'c3',
                                title: 'Python para IA',
                                category: 'Inteligencia Artificial',
                                level: 'PRINCIPIANTE',
                                durationHours: 25
                            }
                        }
                    ]
                }
            }
        });

        const graph = await courseService.getCourseGraph();

        expect(graph).toHaveProperty('nodes');
        expect(graph).toHaveProperty('edges');
        expect(graph.summary.totalCourses).toBe(3);
        expect(graph.summary.totalCategories).toBe(2);

        expect(graph.nodes).toHaveLength(5);
        expect(graph.edges).toHaveLength(3);

        const categoryNode = graph.nodes.find(n => n.type === 'category' && n.label === 'Desarrollo Web');
        expect(categoryNode).toBeDefined();

        const courseNode = graph.nodes.find(n => n.type === 'course' && n.label === 'React Masterclass');
        expect(courseNode).toBeDefined();
        expect(courseNode.group).toBe('Desarrollo Web');
    });
});