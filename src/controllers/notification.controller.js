import NotificationService from '../services/notification.service.js';

export default class NotificationController {
    constructor(notificationService = new NotificationService()) {
        this.notificationService = notificationService;
    }

    getMyNotifications = async (req, res, next) => {
        try {
            const recipientId = req.user.id;
            const limit = Number(req.query.limit) || 20;
            const page = Number(req.query.page) || 1;

            const result = await this.notificationService.getUserNotifications(recipientId, limit, page);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    markAsRead = async (req, res, next) => {
        try {
            const { id } = req.params;
            const recipientId = req.user.id;

            const result = await this.notificationService.markAsRead(id, recipientId);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    markAllAsRead = async (req, res, next) => {
        try {
            const recipientId = req.user.id;
            const result = await this.notificationService.markAllAsRead(recipientId);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };
}