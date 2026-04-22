import { Router } from "express";
import { prisma } from "db";
import { getEmployeeFromRequest } from "../app.ts";

const router = Router();

// GET /api/settings — fetch current user's settings (creates defaults if none exist)
router.get("/", async (req, res) => {
    const employee = await getEmployeeFromRequest(req);
    if (!employee) return res.status(401).json({ error: "Not authenticated" });

    const settings = await prisma.userSettings.upsert({
        where: { ownerId: employee.id },
        create: { ownerId: employee.id },
        update: {},
    });

    res.json(settings);
});

// PUT /api/settings — update current user's settings
router.put("/", async (req, res) => {
    const employee = await getEmployeeFromRequest(req);
    if (!employee) return res.status(401).json({ error: "Not authenticated" });

    const { theme, iconSize, textSize, tagsEnabled, listEnabled } = req.body;

    const settings = await prisma.userSettings.upsert({
        where: { ownerId: employee.id },
        create: { ownerId: employee.id, theme, iconSize, textSize, tagsEnabled, listEnabled },
        update: { theme, iconSize, textSize, tagsEnabled, listEnabled },
    });

    res.json(settings);
});

export default router;