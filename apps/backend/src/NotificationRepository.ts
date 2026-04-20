import { prisma } from "db";

class NotificationRepository {
    async gettAll(){
        return prisma.notification.findMany({orderBy: {id: "asc"}});
    }

    async getAllWithDetails(){
        return prisma.notification.findMany({
            orderBy: { id: "asc" },
            include: {
                employeeNotified: true,
                contentsUsed: true
            }
        });
    }

    async gettById(id: number){
        return prisma.notification.findUnique({
            where: { id },
            include: {
                employeeNotified: true,
                contentsUsed: true
            }
        });
    }

    async gettByEmpIdAll(employeeNotifiedID: number){
        return prisma.notification.findMany({
            where: { employeeNotifiedID },
            orderBy: { id: "asc" },
            include: {
                employeeNotified: true,
                contentsUsed: true
            }
        });
    }

    async gettByEmpIdNew(employeeNotifiedID: number){
        return prisma.notification.findMany({
            where: {
                employeeNotifiedID,
                dateRead:  null
            },
            orderBy: { id: "asc" },
            include: {
                employeeNotified: true,
                contentsUsed: true
            }
        });
    }

    async gettByEmpIdOld(employeeNotifiedID: number){
        return prisma.notification.findMany({
            where: {
                employeeNotifiedID,
                dateRead: {not: null}
            },
            orderBy: { id: "asc" },
            include: {
                employeeNotified: true,
                contentsUsed: true
            }
        });
    }

    //do we need any more???

    async create(data: {
        type: string;
        employeeNotifiedID: number;
        contentIds?: number[];
        customMsg?: string;
    }) {
        return prisma.notification.create({
            data: {
                type: data.type,
                customMsg: data.customMsg,
                employeeNotified: {
                    connect: { id: data.employeeNotifiedID }
                },
                contentsUsed: data.contentIds
                    ? {
                        connect: data.contentIds.map(id => ({ id }))
                    }
                    : undefined,
            }
        });
    }

    //TODO -ne: for giving the same notification to multiple peeps
    async createMany(data: {
        type: string;
        employeeIds: number[];
        contentIds?: number[];
        customMsg?: string;
    }) {
        return Promise.all(
            data.employeeIds.map(empId =>
                prisma.notification.create({
                    data: {
                        type: data.type,
                        customMsg: data.customMsg,
                        employeeNotified: {
                            connect: { id: empId }
                        },
                        contentsUsed: data.contentIds
                            ? {
                                connect: data.contentIds.map(id => ({ id }))
                            }
                            : undefined,
                    }
                })
            )
        );
    }

    async update(id: number, data: {
        type?: string;
        dateSent?: Date;
        dateRead?: Date;
        employeeNotifiedID?: number;
        contentIds?: number[];
    }) {
        return prisma.notification.update({
            where: { id },
            data: {
                type: data.type,
                dateSent: data.dateSent,
                dateRead: data.dateRead,
                employeeNotifiedID: data.employeeNotifiedID,
                contentsUsed: data.contentIds
                    ? {
                        set: data.contentIds.map(id => ({ id }))
                    }
                    : undefined,
            }
        });
    }

    async delete(id: number) {
        return prisma.notification.delete({
            where: {id}
        })
    }

}

export { NotificationRepository };