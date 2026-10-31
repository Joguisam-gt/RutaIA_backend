import BaseRepository from './base.repository.js';

export class NotificationRepository extends BaseRepository {
    constructor() {
        super('notifications');
    }

    /**
     * Obtiene las notificaciones de un usuario ordenadas por fecha de creación descendente.
     */
    async findByRecipient(recipientId, limit = 20, page = 1) {
        const skip = (page - 1) * limit;
        return await this.collection
            .find({ recipientId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    /**
     * Obtiene el número de notificaciones no leídas de un usuario (para el badge de la campana 🔔).
     */
    async countUnreadByRecipient(recipientId) {
        return await this.collection.countDocuments({ recipientId, read: false });
    }

    /**
     * Marca una notificación específica como leída.
     */
    async markAsRead(notificationId, recipientId) {
        return await this.collection.findOneAndUpdate(
            { _id: notificationId, recipientId },
            { $set: { read: true, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
    }

    /**
     * Marca TODAS las notificaciones de un usuario como leídas.
     */
    async markAllAsRead(recipientId) {
        return await this.collection.updateMany(
            { recipientId, read: false },
            { $set: { read: true, updatedAt: new Date() } }
        );
    }
}

const notificationRepositoryInstance = new NotificationRepository();
export default notificationRepositoryInstance;