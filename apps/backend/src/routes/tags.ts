import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import pkg from "express-openid-connect";
import { prisma } from "db";
import { ContentRepository } from "../ContentRepository.ts";

const { requiresAuth } = pkg;

const router = Router();

const contentRepo = new ContentRepository();

function isAdmin(employee: { jobPosition: string }): boolean {
    return employee.jobPosition === "admin";
}

function tagVisibleWhere(employeeId: number) {
    return {
        OR: [{ ownerId: employeeId }, { isGlobal: true }],
    };
}

// ====================================
// POST ===============================
// ====================================
router.post("/tags", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const { tagName, color, isGlobal: wantGlobal } = req.body;

        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            res.status(400).json({ error: "tagName is required" });
            return;
        }

        if (wantGlobal === true && !isAdmin(employee)) {
            res.status(403).json({ error: "Only admins can create global tags" });
            return;
        }

        const normalizedTagName = tagName.trim();
        const makeGlobal = wantGlobal === true && isAdmin(employee);

        if (makeGlobal) {
            const dup = await prisma.tag.findFirst({
                where: { isGlobal: true, tagName: normalizedTagName },
            });
            if (dup) {
                res.status(409).json({ error: "A global tag with this name already exists" });
                return;
            }
        }

        const tag = await prisma.tag.create({
            data: {
                ownerId: employee.id,
                tagName: normalizedTagName,
                color: color,
                isGlobal: makeGlobal,
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            tag,
        });
    } catch (err: any) {
        console.error(err);

        if (err.code === "P2002") {
            res.status(409).json({
                error: err.message?.includes("Tag_tagName_global_key")
                    ? "A global tag with this name already exists"
                    : "You already have a tag with this name",
            });
            return;
        }

        res.status(500).json({
            error: err instanceof Error ? err.message : "Tag creation failed",
        });
    }
});

// ===================================
// GET ===============================
// ===================================

// Personal tags + global tags for the organization
router.get("/tags", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const tags = await prisma.tag.findMany({
            where: tagVisibleWhere(employee.id),
            orderBy: [{ isGlobal: "desc" }, { tagName: "asc" }],
        });

        res.json({
            success: true,
            tags,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load tag",
        });
    }
});

// ===================================
// GET ===============================
// ===================================

// Tag by id if global or owned by this employee
router.get("/tags/:id", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const tagId = Number(req.params.id);

        if (Number.isNaN(tagId)) {
            res.status(400).json({ error: "Invalid tag id" });
            return;
        }

        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                ...tagVisibleWhere(employee.id),
            },
            include: {
                contents: {
                    include: {
                        content: true,
                    },
                },
            },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        res.json({
            success: true,
            tag,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load tag",
        });
    }
});

// =====================================
// PATCH ===============================
// =====================================
router.patch("/tags/:id", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const tagId = Number(req.params.id);
        if (Number.isNaN(tagId)) {
            res.status(400).json({ error: "Invalid tag id" });
            return;
        }

        const { tagName, color, isGlobal: _bodyIsGlobal } = req.body;
        if (_bodyIsGlobal !== undefined && !isAdmin(employee)) {
            res.status(403).json({ error: "Only admins can change the global flag" });
            return;
        }

        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            res.status(400).json({ error: "tagName is required" });
            return;
        }
        if (!color || typeof color !== "string" || !color.trim()) {
            res.status(400).json({ error: "color is required" });
            return;
        }

        const existingTag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!existingTag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        if (existingTag.isGlobal) {
            if (!isAdmin(employee)) {
                res.status(403).json({ error: "Only admins can edit global tags" });
                return;
            }
        } else if (existingTag.ownerId !== employee.id) {
            res.status(403).json({ error: "You can only edit your own tags" });
            return;
        }

        const nextName = tagName.trim();
        if (existingTag.isGlobal) {
            const nameConflict = await prisma.tag.findFirst({
                where: {
                    isGlobal: true,
                    tagName: nextName,
                    NOT: { id: tagId },
                },
            });
            if (nameConflict) {
                res.status(409).json({ error: "A global tag with this name already exists" });
                return;
            }
        }

        const updatedTag = await prisma.tag.update({
            where: {
                id: tagId,
            },
            data: {
                tagName: nextName,
                color: color.trim(),
            },
        });

        res.json({
            success: true,
            tag: updatedTag,
        });
    } catch (err: any) {
        console.error(err);

        if (err.code === "P2002") {
            res.status(409).json({
                error: err.message?.includes("Tag_tagName_global_key")
                    ? "A global tag with this name already exists"
                    : "You already have a tag with this name",
            });
            return;
        }

        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update tag",
        });
    }
});

// ======================================
// DELETE ===============================
// ======================================
router.delete("/tags/:id", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const tagId = Number(req.params.id);

        if (Number.isNaN(tagId)) {
            res.status(400).json({ error: "Invalid tag id" });
            return;
        }

        const tag = await prisma.tag.findUnique({
            where: { id: tagId },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        if (tag.isGlobal) {
            if (!isAdmin(employee)) {
                res.status(403).json({ error: "Only admins can delete global tags" });
                return;
            }
        } else if (tag.ownerId !== employee.id) {
            res.status(403).json({ error: "You can only delete your own tags" });
            return;
        }

        await prisma.tag.delete({
            where: {
                id: tagId,
            },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Delete failed",
        });
    }
});

//==============================
//GET===========================
//==============================
router.get("/tags/:tagId/content", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const tagId = Number(req.params.tagId);

        if (Number.isNaN(tagId)) {
            res.status(400).json({ error: "Invalid tag id" });
            return;
        }

        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                ...tagVisibleWhere(employee.id),
            },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        const content = await contentRepo.getByTag(tagId);

        res.json({
            success: true,
            content,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load content for tag",
        });
    }
});

// TUT ============================
router.get("/tutorial/tags/:tagId/content", requiresAuth(), async (req, res) => {
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        return res.status(404).json({error: "No linked employee account found"});
    }

    const tagId = Number(req.params.tagId);

    if (Number.isNaN(tagId)) {
        return res.status(400).json({error: "Invalid tag id"});
    }

    const tag = await prisma.tag.findFirst({
        where: {
            id: tagId,
            ownerId: employee.id,
        },
    });

    if (!tag) {
        return res.status(404).json({error: "Tag not found"});
    }

    const content = await contentRepo.getTutorialByTag(tagId, employee.id);

    res.json({
        success: true,
        content,
    });
});

export default router;
