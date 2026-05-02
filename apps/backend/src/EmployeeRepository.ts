import { prisma } from "db";

/** Thrown when the employee is still listed as assignee on one or more service request stages. */
export class EmployeeDeleteBlockedByAssignmentsError extends Error {
    readonly code = "EMPLOYEE_HAS_SERVICE_REQUEST_ASSIGNMENTS" as const;
    constructor() {
        super(
            "This employee is still assigned to one or more service request stages. Remove them from those assignments before deleting."
        );
        this.name = "EmployeeDeleteBlockedByAssignmentsError";
    }
}

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
        email?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: Date;
        jobPosition?: string;
        auth0Id?: string;
        profileImageUrl?: string;
    }) {
        return prisma.employee.update({
            where: { id },
            data
        });
    }

    async linkAuth0(email: string, auth0Id: string) {
        return prisma.employee.update({
            where: { email },
            data: { auth0Id }
        });
    }

    /**
     * Deletes an employee after transferring owned content and workflows to {@link newOwnerId},
     * and removing activity logs and notifications for the target.
     * @throws {EmployeeDeleteBlockedByAssignmentsError} when the employee is assigned to any service request stage
     */
    async deleteAsAdmin(targetId: number, newOwnerId: number) {
        const assignedStageCount = await prisma.serviceRequestStage.count({
            where: { employees: { some: { id: targetId } } },
        });
        if (assignedStageCount > 0) {
            throw new EmployeeDeleteBlockedByAssignmentsError();
        }

        await prisma.$transaction(async (tx) => {
            await tx.content.updateMany({
                where: { ownerId: targetId },
                data: { ownerId: newOwnerId },
            });
            await tx.serviceRequestWorkflow.updateMany({
                where: { ownerId: targetId },
                data: { ownerId: newOwnerId },
            });
            await tx.activityLog.deleteMany({ where: { employeeId: targetId } });
            await tx.notification.deleteMany({
                where: { employeeNotifiedID: targetId },
            });
            await tx.employee.delete({ where: { id: targetId } });
        });
    }
}

export { EmployeeRepository };