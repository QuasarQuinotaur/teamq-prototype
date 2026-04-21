import { prisma } from "db";

class ServiceRequestRepository {
    async getAll() {
        return prisma.serviceRequest.findMany({ orderBy: { id: "asc" } });
    }

    async getAllWithDetails() {
        return prisma.serviceRequest.findMany({
            orderBy: { id: "asc" },
            include: {
                owner: { include: { userPhoto: true } },
                employees: { include: { userPhoto: true } },
                contents: true
            }
        });
    }

    async getById(id: number) {
        return prisma.serviceRequest.findUnique({
            where: { id },
            include: {
                owner: { include: { userPhoto: true } },
                employees: { include: { userPhoto: true } },
                contents: true
            }
        });
    }

    async getByCreator(ownerId: number) {
        return prisma.serviceRequest.findMany({
            where: { ownerId },
            orderBy: { id: "asc" },
            include: {
                owner: { include: { userPhoto: true } },
                employees: { include: { userPhoto: true } },
                contents: true
            }
        });
    }

    async getByRequestee(employeeId: number) {
        return prisma.serviceRequest.findMany({
            where: {
                employees: {
                    some: {
                        id: employeeId
                    }
                }
            },
            orderBy: { id: "asc" },
            include: {
                owner: { include: { userPhoto: true } },
                employees: { include: { userPhoto: true } },
                contents: true
            }
        });
    }

    async create(data: {
        ownerId: number;
        title?: string;
        description?: string;
        dateDue?: Date | null;
        priority?: string | null;
        employeeIds?: number[];
        contentIds?: number[];
    }) {
        const assigneeIds = Array.from(
            new Set([...(data.employeeIds ?? []), data.ownerId])
        );
        return prisma.serviceRequest.create({
            data: {
                title: data.title,
                description: data.description,
                ...(data.dateDue !== undefined ? { dateDue: data.dateDue } : {}),
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                owner: {
                    connect: { id: data.ownerId }
                },
                employees: {
                    connect: assigneeIds.map((id) => ({ id })),
                },
                contents: data.contentIds
                    ? {
                        connect: data.contentIds.map(id => ({ id }))
                    }
                    : undefined,
            }
        });
    }
    // async create(data: {
    //     type: string;
    //     ownerId: number;
    //     requesteeID: number;
    // }) {
    //     return prisma.serviceRequest.create({ data });
    // }

    async update(id: number, data: {
        title?: string;
        description?: string;
        dateDue?: Date | null;
        priority?: string | null;
        status?: string;
        ownerId?: number;
        employeeIds?: number[];
        contentIds?: number[];
    }) {
        return prisma.serviceRequest.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                ...(data.dateDue !== undefined ? { dateDue: data.dateDue } : {}),
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                owner: data.ownerId
                    ? { connect: { id: data.ownerId } }
                    : undefined,
                employees: data.employeeIds //overrides all employees assigned???
                    ? {
                        set: data.employeeIds.map(id => ({ id }))
                    }
                    : undefined,
                contents: data.contentIds
                    ? {
                        set: data.contentIds.map(id => ({ id }))
                    }
                    : undefined,
            }
        });
    }

    // async update(id: number, data: {
    //     type?: string;
    //     creatorID?: number;
    //     requesteeID?: number;
    // }) {
    //     return prisma.serviceRequest.update({ where: { id }, data });
    // }

    async delete(id: number) {
        return prisma.serviceRequest.delete({ where: { id } });
    }
}

export { ServiceRequestRepository };