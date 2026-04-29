import { prisma } from "db";
import type { Prisma } from "db";

const workflowCatalogInclude = {
    owner: { include: { userPhoto: true } },
    stages: {
        orderBy: { stageOrder: "asc" as const },
        include: {
            employees: { include: { userPhoto: true } },
            contents: true,
        },
    },
} satisfies Prisma.ServiceRequestWorkflowInclude;

export type WorkflowCatalogEntry = Prisma.ServiceRequestWorkflowGetPayload<{
    include: typeof workflowCatalogInclude;
}>;

const stageDetailInclude = {
    workflow: {
        include: {
            owner: { include: { userPhoto: true } },
            stages: {
                orderBy: { stageOrder: "asc" as const },
                include: {
                    employees: { include: { userPhoto: true } },
                    contents: true,
                },
            },
        },
    },
    employees: { include: { userPhoto: true } },
    contents: true,
} satisfies Prisma.ServiceRequestStageInclude;

/** Deduped stage assignees as sent by the client; creator is not auto-added. */
function uniqueStageEmployeeIds(employeeIds: number[] | undefined): number[] {
    return Array.from(new Set(employeeIds ?? []));
}

class ServiceRequestRepository {
    async getAll() {
        return prisma.serviceRequestWorkflow.findMany({ orderBy: { id: "asc" } });
    }

    async getAllWithDetails(): Promise<WorkflowCatalogEntry[]> {
        return prisma.serviceRequestWorkflow.findMany({
            orderBy: { id: "asc" },
            include: workflowCatalogInclude,
        });
    }

    async getWorkflowById(id: number): Promise<WorkflowCatalogEntry | null> {
        return prisma.serviceRequestWorkflow.findUnique({
            where: { id },
            include: workflowCatalogInclude,
        });
    }

    async getStageById(id: number) {
        return prisma.serviceRequestStage.findUnique({
            where: { id },
            include: stageDetailInclude,
        });
    }

    async getByCreator(ownerId: number): Promise<WorkflowCatalogEntry[]> {
        return prisma.serviceRequestWorkflow.findMany({
            where: { ownerId },
            orderBy: { id: "asc" },
            include: workflowCatalogInclude,
        });
    }

    async getByEmployeeAssigned(employeeId: number): Promise<WorkflowCatalogEntry[]> {
        return prisma.serviceRequestWorkflow.findMany({
            where: {
                stages: {
                    some: {
                        employees: { some: { id: employeeId } },
                    },
                },
            },
            orderBy: { id: "asc" },
            include: workflowCatalogInclude,
        });
    }

    async createWorkflowWithStages(data: {
        ownerId: number;
        title?: string | null;
        stages: Array<{
            title?: string | null;
            description?: string | null;
            dateDue?: Date | null;
            priority?: string | null;
            employeeIds?: number[];
            contentIds?: number[];
        }>;
    }) {
        if (!data.stages.length) {
            throw new Error("At least one stage is required");
        }

        return prisma.serviceRequestWorkflow.create({
            data: {
                title: data.title ?? undefined,
                owner: { connect: { id: data.ownerId } },
                stages: {
                    create: data.stages.map((s, index) => ({
                        stageOrder: index + 1,
                        title: s.title ?? undefined,
                        description: s.description ?? undefined,
                        ...(s.dateDue !== undefined ? { dateDue: s.dateDue } : {}),
                        priority: s.priority ?? undefined,
                        employees: {
                            connect: uniqueStageEmployeeIds(s.employeeIds).map((id) => ({
                                id,
                            })),
                        },
                        contents: s.contentIds?.length
                            ? {
                                  connect: s.contentIds.map((id) => ({ id: Number(id) })),
                              }
                            : undefined,
                    })),
                },
            },
            include: workflowCatalogInclude,
        });
    }

    async updateWorkflow(
        id: number,
        data: {
            title?: string | null;
            ownerId?: number;
        },
    ) {
        return prisma.serviceRequestWorkflow.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.ownerId !== undefined
                    ? { owner: { connect: { id: data.ownerId } } }
                    : {}),
            },
            include: workflowCatalogInclude,
        });
    }

    async updateStage(
        id: number,
        data: {
            title?: string | null;
            description?: string | null;
            dateDue?: Date | null | undefined;
            priority?: string | null;
            status?: string;
            employeeIds?: number[];
            contentIds?: number[];
        },
    ) {
        return prisma.serviceRequestStage.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.dateDue !== undefined ? { dateDue: data.dateDue } : {}),
                ...(data.priority !== undefined ? { priority: data.priority } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.employeeIds !== undefined
                    ? {
                          employees: {
                              set: data.employeeIds.map((eid) => ({ id: eid })),
                          },
                      }
                    : {}),
                ...(data.contentIds !== undefined
                    ? {
                          contents: {
                              set: data.contentIds.map((cid) => ({ id: cid })),
                          },
                      }
                    : {}),
            },
            include: stageDetailInclude,
        });
    }

    async deleteWorkflow(id: number) {
        return prisma.serviceRequestWorkflow.delete({ where: { id } });
    }
}

export { ServiceRequestRepository, uniqueStageEmployeeIds };
