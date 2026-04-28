import { prisma, Employee } from "db";
import { NotificationRepository } from "../NotificationRepository.ts";

const REVIEW_ASSIGNED = "Content Review Assigned";
const REVIEW_DUE_SOON = "Content Review Due Soon";
const REVIEW_EXPIRED = "Content Review Expired";

class ContentReviewService {
    constructor(private notificationRepo: NotificationRepository) {}

    // -------------------------
    // helper: find audience
    // -------------------------
    private async getRecipients(contentId: number, employeeId?: number) {
        if (employeeId) {
            return [employeeId];
        }

        const employees = await prisma.employee.findMany({
            where: {
                OR: [
                    { contentsFavorited: { some: { id: contentId } } },
                    { contentsOwned: { some: { id: contentId } } },
                ],
            },
            select: { id: true },
        });

        return employees.map(e => e.id);
    }

    // -------------------------
    // CREATE REVIEW
    // -------------------------
    async createReview(data: {
        contentId: number;
        stepName: string;
        date: Date;
        employeeId?: number;
        note?: string;
    }) {
        const review = await prisma.contentReview.create({
            data: {
                contentId: data.contentId,
                stepName: data.stepName,
                date: data.date,
                employeeId: data.employeeId,
                note: data.note,
                status: "pending",
            },
        });

        const recipients = await this.getRecipients(data.contentId, data.employeeId);

        await this.notificationRepo.createMany({
            type: REVIEW_ASSIGNED,
            customMsg: `New review step assigned: "${data.stepName}"`,
            employeeIds: recipients,
            contentIds: [data.contentId],
        });

        return review;
    }

    // -------------------------
    // UPDATE REVIEW
    // -------------------------
    async updateReview(
        id: number,
        data: {
            stepName?: string;
            note?: string;
            date?: Date;
            status?: "pending" | "done" | "skipped";
        }
    ) {
        const existing = await prisma.contentReview.findUnique({
            where: { id },
        });

        if (!existing) throw new Error("Review not found");

        const updated = await prisma.contentReview.update({
            where: { id },
            data: {
                ...data,
                ...(data.status === "done"
                    ? { completedAt: new Date() }
                    : {}),
            },
        });

        // -------------------------
        // STATUS-BASED NOTIFICATIONS
        // -------------------------

        const recipients = await this.getRecipients(
            existing.contentId,
            existing.employeeId ?? undefined
        );

        const now = new Date();
        const dueDate = existing.date;

        // EXPIRED
        if (dueDate < now && updated.status !== "done") {
            await this.notificationRepo.createMany({
                type: REVIEW_EXPIRED,
                customMsg: `Review "${existing.stepName}" has expired`,
                employeeIds: recipients,
                contentIds: [existing.contentId],
            });
        }

        // DUE SOON
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours <= 24 && diffHours > 0 && updated.status === "pending") {
            await this.notificationRepo.createMany({
                type: REVIEW_DUE_SOON,
                customMsg: `Review "${existing.stepName}" is due soon`,
                employeeIds: recipients,
                contentIds: [existing.contentId],
            });
        }

        return updated;
    }

    // -------------------------
    // DELETE
    // -------------------------
    async deleteReview(id: number) {
        return prisma.contentReview.delete({
            where: { id },
        });
    }

    // -------------------------
    // GET helpers
    // -------------------------
    async getAll() {
        return prisma.contentReview.findMany({
            orderBy: { date: "asc" },
            include: { content: true, employee: true },
        });
    }

    async getByContentId(contentId: number) {
        return prisma.contentReview.findMany({
            where: { contentId },
            orderBy: { date: "asc" },
            include: { employee: true },
        });
    }
}

export { ContentReviewService };