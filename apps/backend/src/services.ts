import { ContentRepository } from "./ContentRepository";
import { NotificationRepository } from "./NotificationRepository";
import { ContentService } from "./Service/NotifContentServices";

const contentRepo = new ContentRepository();
export const notificationRepo = new NotificationRepository();

export const contentService = new ContentService(
    contentRepo,
    notificationRepo
);