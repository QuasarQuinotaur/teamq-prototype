import { prisma, Employee } from "db";
import { NotificationRepository } from "../NotificationRepository.ts";
import { ContentReviewRepository } from "../ContentReviewRepository";


const REVIEW_ASSIGNED = "Content Review Assigned";
const REVIEW_DUE_SOON = "Content Review Due Soon";
const REVIEW_EXPIRED = "Content Review Expired";


class ContentReviewService {
    constructor(
        private reviewRepo: ContentReviewRepository,
        private notificationRepo: NotificationRepository
    ) {}
    // -------------------------
    // helper: find audience
    // -------------------------
    private async getRecipients(contentId: number, employeeId: number | null) {
        // specifically assigned, ONLY them
        if (employeeId !== null) {
            return [employeeId];
        }

        //  general review
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: {
                ownerId: true,
                jobPositions: true,
                employeesFavorited: {
                    select: { id: true },
                },
            },
        });

        if (!content) return [];

        // owner
        const ownerIds = [content.ownerId];

        // favorited
        const favoritedIds = content.employeesFavorited.map(e => e.id);

        // visible users (job position match)
        const visibleEmployees = await prisma.employee.findMany({
            where: {
                jobPosition: { in: content.jobPositions },
            },
            select: { id: true },
        });

        const visibleIds = visibleEmployees.map(e => e.id);

        // combine + dedupe
        const allIds = new Set([
            ...ownerIds,
            ...favoritedIds,
            ...visibleIds,
        ]);

        return Array.from(allIds);
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
        const review = await this.reviewRepo.create(data);

        const recipients = await this.getRecipients(
            review.contentId,
            review.employeeId ?? null
        );

        await this.notificationRepo.createMany({
            type: REVIEW_ASSIGNED,
            customMsg: `New review step assigned: "${review.stepName}"`,
            employeeIds: recipients,
            contentIds: [review.contentId],
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
        // get existing (for recipients + message context)
        const existing = await prisma.contentReview.findUnique({
            where: { id },
        });

        if (!existing) throw new Error("Review not found");

        // use repo for update
        const updated = await this.reviewRepo.update(id, data);

        const recipients = await this.getRecipients(
            updated.contentId,
            updated.employeeId
        );

        //send notification
        await this.notificationRepo.createMany({
            type: "Content Review Updated",
            customMsg: `Review "${updated.stepName}" was updated`,
            employeeIds: recipients,
            contentIds: [updated.contentId],
        });

        return updated;
    }

    // -------------------------
    // DELETE
    // -------------------------
    async deleteReview(id: number) {
        const existing = await prisma.contentReview.findUnique({
            where: { id },
        });

        if (!existing) throw new Error("Review not found");

        const deleted = await this.reviewRepo.delete(id);

        const recipients = await this.getRecipients(
            existing.contentId,
            existing.employeeId
        );

        await this.notificationRepo.createMany({
            type: "Content Review Deleted",
            customMsg: `Review "${existing.stepName}" was deleted`,
            employeeIds: recipients,
            contentIds: [existing.contentId],
        });

        return deleted;
    }

    // -------------------------
    // BACKGROUND JOB: CHECK REVIEWS
    // -------------------------
    async processReviewNotifications() {
        const now = new Date();

        const reviews = await prisma.contentReview.findMany({
            where: {
                status: "pending",
            },
        });

        for (const review of reviews) {
            const dueDate = review.date;

            const recipients = await this.getRecipients(
                review.contentId,
                review.employeeId
            );

            const diffHours =
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

            // -------------------------
            // EXPIRED (send once)
            // -------------------------
            if (
                dueDate < now &&
                !review.expiredNotified
            ) {
                await this.notificationRepo.createMany({
                    type: REVIEW_EXPIRED,
                    customMsg: `Review "${review.stepName}" has expired`,
                    employeeIds: recipients,
                    contentIds: [review.contentId],
                });

                await prisma.contentReview.update({
                    where: { id: review.id },
                    data: { expiredNotified: true },
                });

                continue; // skip due soon if already expired
            }

            // -------------------------
            // DUE SOON (send once)
            // -------------------------
            if (
                diffHours <= 24 &&
                diffHours > 0 &&
                !review.dueSoonNotified
            ) {
                await this.notificationRepo.createMany({
                    type: REVIEW_DUE_SOON,
                    customMsg: `Review "${review.stepName}" is due soon`,
                    employeeIds: recipients,
                    contentIds: [review.contentId],
                });

                await prisma.contentReview.update({
                    where: { id: review.id },
                    data: { dueSoonNotified: true },
                });
            }
        }


    }

    async getAll() {
        return prisma.contentReview.findMany({
            orderBy: { date: "asc" },
            include: { Content: true, employee: true },
        });
    }

    async getByContentId(contentId: number) {
        return prisma.contentReview.findMany({
            where: { contentId },
            orderBy: { date: "asc" },
            include: { Employee: true },
        });
    }
}

export { ContentReviewService };