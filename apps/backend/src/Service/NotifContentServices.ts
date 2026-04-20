//workflows for notifications
//notification + content

import { NotificationRepository } from "../NotificationRepository.ts";
import { ContentRepository} from "../ContentRepository.ts";
import {Employee, prisma} from "db";
import { deleteFile } from "../lib/supabase";

class ContentService {
    constructor(
        private contentRepo: ContentRepository,
        private notificationRepo: NotificationRepository
    ) {}

    async deleteContent(id: number, employee: Employee) {
        const content = await this.contentRepo.getById(id);

        if (!content) throw new Error("Not found");

        // authorization (move from route)
        const isOwner = content.ownerId === employee.id;
        const isAdmin = employee.jobPosition === "admin";

        if (!isOwner && !isAdmin) {
            throw new Error("Not authorized");
        }

        //  checkout rule
        if (content.isCheckedOut) {
            throw new Error("Cannot delete checked-out content");
        }

        //  get favorites BEFORE deletion
        const favs = await prisma.content.findUnique({
            where: { id },
            select: {
                employeesFavorited: true
            }
        });

        // delete file
        if (content.filePath && !content.filePath.startsWith("http")) {
            await deleteFile(content.filePath);
        }

        // delete DB record
        await this.contentRepo.delete(id);

        //  notify users (SYSTEM GENERATED)
        if (favs?.employeesFavorited.length) {
            await this.notificationRepo.createMany({
                type: "CONTENT_DELETED_FAVORITED",
                customMsg: `Content "${content.title}" was deleted`,
                employeeIds: favs.employeesFavorited.map(emp => emp.id),
                contentIds: [content.id], //TODO idk we want this but like its there :D
            });
        }
    }
}

//TODO ADD MORE SYSTEM NOTIFICATION IF WANTED

export { ContentService };