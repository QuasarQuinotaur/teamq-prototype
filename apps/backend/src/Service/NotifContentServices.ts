//workflows for notifications
//notification + content

import { NotificationRepository } from "../NotificationRepository.ts";
import { ContentRepository} from "../ContentRepository.ts";
import {Employee, prisma} from "db";
import { deleteFile, tryDeleteStoredPath } from "../lib/supabase.ts";
import { getEmployeeIsAdmin } from "../util.ts";

class ContentService {
    constructor(
        private contentRepo: ContentRepository,
        private notificationRepo: NotificationRepository
    ) {}

    async deleteContent(id: number, employee: Employee) {
        const content = await this.contentRepo.getById(id, employee.id);

        if (!content) throw new Error("Content not found");

        if (!content.isCheckedOut) {
            throw new Error("Check out the document before deleting.");
        }

        if (content.checkedOutById !== employee.id) {
            throw new Error("Cannot delete while document is checked out by another user");
        }

        // authorization (move from route)
        const isOwner = content.ownerId === employee.id;
        const isAdmin = await getEmployeeIsAdmin(employee);

        if (!isOwner && !isAdmin) {
            throw new Error("Not authorized to delete this content");
        }

        //  get favorites BEFORE deletion
        const favs = await prisma.content.findUnique({
            where: { id },
            select: {
                employeesFavorited: true
            }
        });

        // delete file
        if (content.thumbnailPath?.trim()) {
            await tryDeleteStoredPath(content.thumbnailPath);
        }
        if (content.filePath && !content.filePath.startsWith("http")) {
            await deleteFile(content.filePath);
        }

        // delete DB record
        await this.contentRepo.delete(id);

        //  notify users (SYSTEM GENERATED)
        if (favs?.employeesFavorited.length) {
            const deletedBy = `${employee.firstName} ${employee.lastName}`;
            await this.notificationRepo.createMany({
                type: "One of your favorite documents was deleted",
                customMsg: `"${content.title}" was permanently deleted by ${deletedBy}. This document has been removed from your favorites and is no longer accessible.`,
                employeeIds: favs.employeesFavorited.map(emp => emp.id),
            });
        }
    }
}

//TODO ADD MORE SYSTEM NOTIFICATION IF WANTED

export { ContentService };