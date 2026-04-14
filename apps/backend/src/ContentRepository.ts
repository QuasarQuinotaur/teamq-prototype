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
            where: {
                jobPositions: {
                    has: jobPosition
                }
            },
            orderBy: { id: "asc" },
            include: { owner: true }
        });
    }

    async getByMultJobPosition(jobPosition: string[]) {
        return prisma.content.findMany({
            where: {
                jobPositions: {
                    hasSome: jobPosition
                }
            },
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
        filePath?: string;
        fileSize?: number;
        jobPositions: string[];
        contentType: string;
        expirationDate: Date;
        ownerId: number;
    }) {
        return prisma.content.create({
            data: {
                title: data.title,
                filePath: data.filePath,
                fileSize: data.fileSize,
                jobPositions: data.jobPositions,
                contentType: data.contentType,
                expirationDate: data.expirationDate,
                owner: {
                    connect: { id: data.ownerId }
                }
            }
        });
    }

    async update(id: number, data: {
        title?: string;
        filePath?: string;
        fileName?: string;
        fileSize?: number;
        jobPositions?: string[];
        contentType?: string;

        expirationDate?: Date;
        ownerId?: number;
    }) {
        const { ownerId, ...rest } = data;

        return prisma.content.update({
            where: { id },
            data: {
                ...rest,
                owner: ownerId
                    ? { connect: { id: ownerId } }
                    : undefined
            }
        });
    }

    async delete(id: number) {
        return prisma.content.delete({
            where: { id }
        });
    }
}

export { ContentRepository };