import notificationRepositoryInstance from '../repositories/notification.repository.js';
import NotificationResponseDTO from '../dtos/notification/notificationResponse.dto.js';
import NotFoundError from '../errors/notFoundError.js';

export default class NotificationService {
    constructor(notificationRepository = notificationRepositoryInstance) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Crea y emite una nueva notificación para un usuario o profesor.
     */
    async createNotification(createNotificationDto) {
        const notificationData = {
            recipientId: createNotificationDto.recipientId,
            recipientRole: createNotificationDto.recipientRole,
            type: createNotificationDto.type,
            title: createNotificationDto.title,
            message: createNotificationDto.message,
            actionUrl: createNotificationDto.actionUrl,
            read: false
        };

        const created = await this.notificationRepository.create(notificationData);
        return NotificationResponseDTO.fromEntity(created);
    }

    /**
     * Obtiene el buzón de notificaciones del usuario autenticado.
     */
    async getUserNotifications(recipientId, limit = 20, page = 1) {
        const list = await this.notificationRepository.findByRecipient(recipientId, limit, page);
        const unreadCount = await this.notificationRepository.countUnreadByRecipient(recipientId);

        return {
            unreadCount,
            notifications: list.map((item) => NotificationResponseDTO.fromEntity(item))
        };
    }

    /**
     * Marca una notificación individual como leída.
     */
    async markAsRead(notificationId, recipientId) {
        const updated = await this.notificationRepository.markAsRead(notificationId, recipientId);
        if (!updated) {
            throw new NotFoundError('La notificación especificada no existe o no pertenece al usuario.');
        }
        return NotificationResponseDTO.fromEntity(updated);
    }

    /**
     * Marca todo el buzón del usuario como leído.
     */
    async markAllAsRead(recipientId) {
        await this.notificationRepository.markAllAsRead(recipientId);
        return { message: 'Todas las notificaciones se marcaron como leídas.' };
    }
}