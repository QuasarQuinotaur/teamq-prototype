import { prisma } from "db";

class ServiceRequestRepository {
    async getAll() {
        return prisma.serviceRequest.findMany({ orderBy: { id: "asc" } });
    }

    async getAllWithDetails() {
        return prisma.serviceRequest.findMany({
            orderBy: { id: "asc" },
            include: {
                creator: true,
                requestee: true
            }
        });
    }

    async getById(id: number) {
        return prisma.serviceRequest.findUnique({
            where: { id },
            include: {
                creator: true,
                requestee: true
            }
        });
    }

    async getByCreator(creatorID: number) {
        return prisma.serviceRequest.findMany({
            where: { creatorID },
            orderBy: { id: "asc" },
            include: {
                creator: true,
                requestee: true
            }
        });
    }

    async getByRequestee(requesteeID: number) {
        return prisma.serviceRequest.findMany({
            where: { requesteeID },
            orderBy: { id: "asc" },
            include: {
                creator: true,
                requestee: true
            }
        });
    }

    async create(data: {
        type: string;
        creatorID: number;
        requesteeID: number;
    }) {
        return prisma.serviceRequest.create({ data });
    }

    async update(id: number, data: {
        type?: string;
        creatorID?: number;
        requesteeID?: number;
    }) {
        return prisma.serviceRequest.update({ where: { id }, data });
    }

    async delete(id: number) {
        return prisma.serviceRequest.delete({ where: { id } });
    }
}

export { ServiceRequestRepository };