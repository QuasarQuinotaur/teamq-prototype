import { prisma } from "db";

class ContentReviewRepository {
    // block tutorial content everywhere
    private async assertNotTutorial(contentId: number) {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: { isTutorial: true },
        });

        if (content?.isTutorial) {
            throw new Error("ContentReview is not allowed for tutorial content");
        }
    }



    // GET
    async getAll() {
        return prisma.contentReview.findMany({
            orderBy: { date: "asc" },
            include: {
                Content: true,
                employee: true,
            },
        });
    }

    // GET
    async getByContentId(contentId: number) {
        await this.assertNotTutorial(contentId);

        return prisma.contentReview.findMany({
            where: { contentId },
            orderBy: { date: "asc" },
            include: {
                employee: true,
            },
        });
    }

    // CREATe
    async create(data: {
        contentId: number;
        stepName: string;
        date: Date; // required due date
        employeeId?: number;
        note?: string;
    }) {
        await this.assertNotTutorial(data.contentId);

        return prisma.contentReview.create({
            data: {
                contentId: data.contentId,
                stepName: data.stepName,
                date: data.date,
                employeeId: data.employeeId,
                note: data.note,
                status: "pending",
            },
        });
    }

    // UPDATE \
    async update(
        id: number,
        data: {
            stepName?: string;
            note?: string;
            date?: Date;
            status?: "pending" | "done" | "skipped";
        }
    ) {
        const isCompleting = data.status === "done";

        return prisma.contentReview.update({
            where: { id },
            data: {
                ...(data.stepName !== undefined ? { stepName: data.stepName } : {}),
                ...(data.note !== undefined ? { note: data.note } : {}),
                ...(data.date !== undefined ? { date: data.date } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),

                // only set completion timestamp when first marked done
                ...(isCompleting ? { completedAt: new Date() } : {}),
            },
        });
    }

    // mark done
    async markDone(id: number, note?: string) {
        return prisma.contentReview.update({
            where: { id },
            data: {
                status: "done",
                completedAt: new Date(),
                ...(note !== undefined ? { note } : {}),
            },
        });
    }

    // skip step
    async skip(id: number) {
        return prisma.contentReview.update({
            where: { id },
            data: {
                status: "skipped",
            },
        });
    }

    // delete review
    async delete(id: number) {
        return prisma.contentReview.delete({
            where: { id },
        });
    }
}

export { ContentReviewRepository };