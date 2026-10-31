export default class NotificationResponseDTO {
    static fromEntity(entity) {
        return {
            id: entity._id,
            recipientId: entity.recipientId,
            recipientRole: entity.recipientRole,
            type: entity.type,
            title: entity.title,
            message: entity.message,
            actionUrl: entity.actionUrl,
            read: entity.read,
            createdAt: entity.createdAt
        };
    }
}