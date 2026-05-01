import { Router } from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;
import { prisma } from "db";
import { getEmployeeFromRequest } from "../app.ts";
import { ContentRepository } from "../ContentRepository.ts";

const router = Router();
const contentRepo = new ContentRepository();

// ===================================
// GET ===============================
// ===================================

//Get all favorites for the logged-in employee
router.get("/", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const fullEmployee = await prisma.employee.findUnique({
            where: { id: employee.id },
            include: {
                contentsFavorited: {
                    where: {
                        isTutorial: false
                    },
                    include: {
                        owner: true,
                        checkedOutBy: { include: { userPhoto: true } },
                        tags: { include: { tag: true } },
                    },
                    orderBy: {
                        dateAdded: "desc",
                    },
                },
            },
        });

        res.json(fullEmployee?.contentsFavorited ?? []);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load favorites",
        });
    }
});

// ====================================
// POST ===============================
// ====================================

//Favorite a piece of content
router.post("/:contentId", requiresAuth(), async (req, res) => {
    const contentId = Number(req.params.contentId);

    if (isNaN(contentId)) {
        res.status(400).json({ error: "Invalid content id" });
        return;
    }

    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const content = await contentRepo.getById(contentId, employee.id);

        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }



        const updated = await prisma.employee.update({
            where: { id: employee.id },
            data: {
                contentsFavorited: {
                    connect: { id: contentId },
                },
            },
            include: {
                contentsFavorited: {
                    where: {
                        isTutorial: false
                    },
                    include: {
                        owner: true,
                        checkedOutBy: { include: { userPhoto: true } },
                        tags: { include: { tag: true } },
                    },
                    orderBy: {
                        dateAdded: "desc",
                    },
                },
            },
        });

        res.json({
            success: true,
            favorites: updated.contentsFavorited,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to favorite content",
        });
    }
});

// ======================================
// DELETE ===============================
// ======================================

//Remove a favorite
router.delete("/:contentId", requiresAuth(), async (req, res) => {
    const contentId = Number(req.params.contentId);

    if (isNaN(contentId)) {
        res.status(400).json({ error: "Invalid content id" });
        return;
    }

    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const updated = await prisma.employee.update({
            where: { id: employee.id },
            data: {
                contentsFavorited: {
                    disconnect: { id: contentId },
                },
            },
            include: {
                contentsFavorited: {
                    where: {
                        isTutorial: false
                    },
                    include: {
                        owner: true,
                        checkedOutBy: { include: { userPhoto: true } },
                        tags: { include: { tag: true } },
                    },
                    orderBy: {
                        dateAdded: "desc",
                    },
                },
            },
        });

        res.json({
            success: true,
            favorites: updated.contentsFavorited,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to remove favorite",
        });
    }

});


//TUT ========================================

router.get("/tutorial", requiresAuth(), async (req, res) => {
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        return res.status(404).json({ error: "No linked employee account found" });
    }

    const fullEmployee = await prisma.employee.findUnique({
        where: { id: employee.id },
        include: {
            contentsFavorited: {
                where: {
                    isTutorial: true,
                    ownerId: employee.id
                },
                include: {
                    owner: true,
                    checkedOutBy: true,
                },
                orderBy: {
                    dateAdded: "desc",
                },
            },
        },
    });

    res.json(fullEmployee?.contentsFavorited ?? []);
});

export default router;