import { Router } from "express";
import { prisma } from "db";

const router = Router();


// ===================================
// GET /api/roles — fetch all roles
// ===================================
router.get("/", async (req, res) => {
    try {
        const roles = await prisma.role.findMany({ orderBy: { id: "asc"} });
        res.json({
            success: true,
            roles: roles
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to get roles",
        });
    }
});

export default router;