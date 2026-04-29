import { Router } from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;
import { prisma } from "db";

const router = Router();

router.get("/", requiresAuth(), async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const typeFilter = req.query.type as string | undefined;
        const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
        const since = req.query.since ? new Date(req.query.since as string) : undefined;

        const events: {
            type: string;
            contentId: number;
            contentTitle: string;
            employeeId: number | null;
            employeeName: string | null;
            timestamp: Date;
        }[] = [];

        // Created events
        if (!typeFilter || typeFilter === "created") {
            const created = await prisma.content.findMany({
                orderBy: { dateAdded: "desc" },
                take: limit,
                where: {
                    ...(employeeId ? { ownerId: employeeId } : {}),
                    ...(since ? { dateAdded: { gte: since } } : {}),
                },
                select: {
                    id: true,
                    title: true,
                    dateAdded: true,
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            for (const c of created) {
                events.push({
                    type: "created",
                    contentId: c.id,
                    contentTitle: c.title,
                    employeeId: c.owner?.id ?? null,
                    employeeName: c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : null,
                    timestamp: c.dateAdded,
                });
            }
        }

        // Updated events
        if (!typeFilter || typeFilter === "updated") {
            const updated = await prisma.content.findMany({
                orderBy: { dateUpdated: "desc" },
                take: limit,
                where: {
                    ...(employeeId ? { ownerId: employeeId } : {}),
                    ...(since ? { dateUpdated: { gte: since } } : {}),
                },
                select: {
                    id: true,
                    title: true,
                    dateUpdated: true,
                    owner: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            for (const c of updated) {
                events.push({
                    type: "updated",
                    contentId: c.id,
                    contentTitle: c.title,
                    employeeId: c.owner?.id ?? null,
                    employeeName: c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : null,
                    timestamp: c.dateUpdated,
                });
            }
        }

        // Accessed events (from RecentContentView)
        if (!typeFilter || typeFilter === "accessed") {
            const accessed = await prisma.recentContentView.findMany({
                orderBy: { lastViewedAt: "desc" },
                take: limit,
                where: {
                    ...(employeeId ? { employeeId } : {}),
                    ...(since ? { lastViewedAt: { gte: since } } : {}),
                },
                select: {
                    lastViewedAt: true,
                    Content: { select: { id: true, title: true } },
                    Employee: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            for (const a of accessed) {
                events.push({
                    type: "accessed",
                    contentId: a.Content.id,
                    contentTitle: a.Content.title,
                    employeeId: a.Employee.id,
                    employeeName: `${a.Employee.firstName} ${a.Employee.lastName}`,
                    timestamp: a.lastViewedAt,
                });
            }
        }

        // Deleted events
        if (!typeFilter || typeFilter === "deleted") {
            const deleted = await prisma.deletedContentLog.findMany({
                orderBy: { deletedAt: "desc" },
                take: limit,
                where: {
                    ...(employeeId ? { deletedById: employeeId } : {}),
                    ...(since ? { deletedAt: { gte: since } } : {}),
                },
                select: {
                    id: true,
                    contentId: true,
                    title: true,
                    deletedAt: true,
                    deletedBy: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            for (const d of deleted) {
                events.push({
                    type: "deleted",
                    contentId: d.contentId,
                    contentTitle: d.title,
                    employeeId: d.deletedBy?.id ?? null,
                    employeeName: d.deletedBy ? `${d.deletedBy.firstName} ${d.deletedBy.lastName}` : null,
                    timestamp: d.deletedAt,
                });
            }
        }

        // Sort merged events by timestamp (most recent first)
        events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        res.json({ events });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch activity" });
    }
});

export default router;