import { prisma, type Prisma } from "db";
import { RecentContentViewOrderByWithRelationInput, RecentContentViewWhereInput } from "../../../packages/db/generated/prisma/models";

const contentCatalogInclude = {
    owner: true,
    checkedOutBy: { include: { userPhoto: true } },
    tags: { include: { tag: true } },
} satisfies Prisma.ContentInclude;

class ContentRepository {
    async getAll() {
        return this.listWithFilters({}, { id: "asc" });
    }

    /**
     * List content for catalog with tags in one query (avoids N+1 tag fetches).
     * Pass `{}` and `{ id: "asc" }` for the full catalog (same as legacy getAll ordering).
     */
    async listWithFilters(
        where: Prisma.ContentWhereInput,
        orderBy:
            | Prisma.ContentOrderByWithRelationInput
            | Prisma.ContentOrderByWithRelationInput[],
    ) {
        return prisma.content.findMany({
            where,
            orderBy,
            include: contentCatalogInclude,
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
            include: {
                owner: true,
                checkedOutBy: { include: { userPhoto: true } },
                tags: { include: { tag: true } },
            },
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
    async recordView(employeeId: number, contentId: number) {
        return prisma.recentContentView.upsert({
            where: {
                employeeId_contentId: {
                    employeeId,
                    contentId,
                },
            },
            update: {
                lastViewedAt: new Date(),
            },
            create: {
                employeeId,
                contentId,
                lastViewedAt: new Date(),
            },
        });
    }

    async getRecentViews(
        employeeId: number, take = 10,
        where?: RecentContentViewWhereInput,
        orderBy?:
            | Prisma.RecentContentViewOrderByWithRelationInput
            | Prisma.RecentContentViewOrderByWithRelationInput[]
    ) {
        return prisma.recentContentView.findMany({
            where: where ? { employeeId, ...where } : { employeeId },
            orderBy: orderBy ?? { lastViewedAt: "desc" },
            take,
            include: {
                content: {
                    include: {
                        owner: true,
                        checkedOutBy: { include: { userPhoto: true } },
                    },
                },
            },
        });
    }
    async getTags(contentId: number) {
        return prisma.content.findUnique({
            where: { id: contentId },
            include: {
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
    }

    async addTag(contentId: number, tagId: number) {
        return prisma.contentTag.create({
            data: {
                contentId,
                tagId
            }
        });
    }

    async removeTag(contentId: number, tagId: number) {
        return prisma.contentTag.delete({
            where: {
                contentId_tagId: {
                    contentId,
                    tagId
                }
            }
        });

    }
    async getByTag(tagId: number) {
        return prisma.content.findMany({
            where: {
                tags: {
                    some: {
                        tagId: tagId
                    }
                }
            },
            orderBy: { id: "asc" },
            include: {
                owner: true,
                checkedOutBy: { include: { userPhoto: true } },
            },
        });
    }
}

export { ContentRepository };