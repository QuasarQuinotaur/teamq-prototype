import { prisma } from "db";

class ContentRepository {
    async getAll() {
        return prisma.content.findMany({
            orderBy: { id: "asc" },
            include: { owner: true }
        });
    }

    async getByJobPosition(jobPosition: string) {
        return prisma.content.findMany({
            where: { jobPosition },
            orderBy: { id: "asc" },
            include: { owner: true }
        });
    }

    async getById(id: number) {
        return prisma.content.findUnique({
            where: { id },
            include: { owner: true }
        });
    }

    async getByOwner(ownerId: number) {
        return prisma.content.findMany({
            where: { ownerId },
            orderBy: { id: "asc" },
            include: { owner: true }
        });
    }

    async create(data: {
        title: string;
        link: string;
        ownerName: string;
        jobPosition: string;
        contentType: string;
        status: string;
        expirationDate: Date;
        ownerId: number;
    }) {
        return await prisma.content.create({ data });
    }

    async update(id: number, data: {
        title?: string;
        link?: string;
        ownerName?: string;
        jobPosition?: string;
        contentType?: string;
        status?: string;
        expirationDate?: Date;
    }) {
        return prisma.content.update({
            where: { id },
            data
        });
    }

    async delete(id: number) {
        return prisma.content.delete({
            where: { id }
        });
    }
}

export { ContentRepository };