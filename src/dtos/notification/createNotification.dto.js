import BadRequestError from '../../errors/badRequestError.js';

export default class CreateNotificationDTO {
    constructor({ recipientId, recipientRole, type, title, message, actionUrl }) {
        this.recipientId = recipientId;
        this.recipientRole = recipientRole;
        this.type = type;
        this.title = title;
        this.message = message;
        this.actionUrl = actionUrl;

        Object.freeze(this);
    }

    static fromRequest(data) {
        if (!data.recipientId || !data.recipientRole || !data.type || !data.title || !data.message) {
            throw new BadRequestError('Campos obligatorios faltantes para crear la notificación.');
        }

        const validRoles = ['student', 'instructor', 'admin'];
        if (!validRoles.includes(data.recipientRole)) {
            throw new BadRequestError(`Rol de destinatario inválido: ${data.recipientRole}`);
        }

        const validTypes = ['AI_RESPONSE', 'COURSE_COMPLETED', 'PAYMENT_CONFIRMED', 'SYSTEM', 'PROJECT_REVIEW'];
        if (!validTypes.includes(data.type)) {
            throw new BadRequestError(`Tipo de notificación inválido: ${data.type}`);
        }

        return new CreateNotificationDTO({
            recipientId: String(data.recipientId).trim(),
            recipientRole: String(data.recipientRole).trim(),
            type: String(data.type).trim(),
            title: String(data.title).trim(),
            message: String(data.message).trim(),
            actionUrl: data.actionUrl ? String(data.actionUrl).trim() : null
        });
    }
}