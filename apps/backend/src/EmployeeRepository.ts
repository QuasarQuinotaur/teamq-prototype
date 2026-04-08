import { prisma } from "db";

class EmployeeRepository {
    async getAll() {
        return prisma.employee.findMany({ orderBy: { id: "asc" } });
    }

    async getById(id: number) {
        return prisma.employee.findUnique({ where: { id } });
    }

    async getByEmail(email: string) {
        return prisma.employee.findUnique({ where: { email } });
    }

    async getByAuth0Id(auth0Id: string) {
        return prisma.employee.findUnique({ where: { auth0Id } });
    }

    async getByJobPosition(jobPosition: string) {
        return prisma.employee.findMany({
            where: { jobPosition },
            orderBy: { id: "asc" }
        });
    }

    async create(data: {
        username: string;
        password: string;
        role: string;
        email: string;
        firstName: string;
        lastName: string;
        dateOfBirth: Date;
        jobPosition: string;
        auth0Id?: string;
    }) {
        return prisma.employee.create({ data });
    }

    async update(id: number, data: {
        username?: string;
        password?: string;
        role?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: Date;
        jobPosition?: string;
        auth0Id?: string;
    }) {
        return prisma.employee.update({ where: { id }, data });
    }

    async linkAuth0(email: string, auth0Id: string) {
        return prisma.employee.update({
            where: { email },
            data: { auth0Id }
        });
    }

    async delete(id: number) {
        return prisma.employee.delete({ where: { id } });
    }
}

export { EmployeeRepository };