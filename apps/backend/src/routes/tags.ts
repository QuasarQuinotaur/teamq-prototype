import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import pkg from "express-openid-connect";
import { prisma } from "db";
import { ContentRepository } from "../ContentRepository.ts";

const { requiresAuth } = pkg;

const router = Router();

const contentRepo = new ContentRepository();
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

        const { tagName, color } = req.body;

        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            res.status(400).json({ error: "tagName is required" });
            return;
        }

        const normalizedTagName = tagName.trim();

        const tag = await prisma.tag.create({
            data: {
                ownerId: employee.id,
                tagName: normalizedTagName,
                color: color,
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


        res.status(500).json({
            error: err instanceof Error ? err.message : "Tag creation failed",
        });
    }
});


// ===================================
// GET ===============================
// ===================================

// all tags belonging to current employee
router.get("/tags", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const tags = await prisma.tag.findMany({
            where: {
                ownerId: employee.id,
            },
        });

        if (!tags) {
            res.status(404).json({ error: "Tags not found" });
            return;
        }

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

// tag by ID for employee
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
                ownerId: employee.id,
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

        const { tagName, color } = req.body;

        if (!tagName || typeof tagName !== "string" || !tagName.trim()) {
            res.status(400).json({ error: "tagName is required" });
            return;
        }
        if (!color || typeof color !== "string" || !color.trim()) {
            res.status(400).json({ error: "color is required" });
            return;
        }

        const existingTag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                ownerId: employee.id,
            },
        });

        if (!existingTag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        const updatedTag = await prisma.tag.update({
            where: {
                id: tagId,
            },
            data: {
                tagName: tagName.trim(),
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
                error: "You already have a tag with this name",
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

        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                ownerId: employee.id,
            },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
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
                ownerId: employee.id
            }
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        const content = await contentRepo.getByTag(tagId);

        res.json({
            success: true,
            content
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