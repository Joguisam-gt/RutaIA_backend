// src/services/metric.service.js
import { ObjectId } from 'mongodb';
import Database from '../config/database.js';

export default class MetricService {
    async getMetricsByStudent(studentId) {
        const db = Database.getDb();
        const sId = ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId;
        const metric = await db.collection('metrics').findOne({ studentId: sId });
        return metric || { totalHours: 0, certificatesCount: 0, currentStreak: 0 };
    }
}