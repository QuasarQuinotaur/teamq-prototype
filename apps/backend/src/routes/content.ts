import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import { uploadBuffer } from "../lib/supabase.ts";
import pkg from "express-openid-connect";
import { prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";

const router = Router();
const upload = multer();

router.post("/upload", requiresAuth(), upload.single("file"), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const {
            name,
            link,
            jobPosition,
            expirationDate,
            contentType,
            status,
        } = req.body;

        if (!name?.trim() || !jobPosition?.trim() || !expirationDate || !contentType?.trim() || !status?.trim()) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const hasFile = !!req.file;
        const hasLink = !!link?.trim();

        if (!hasFile && !hasLink) {
            res.status(400).json({ error: "Provide either a file or an external link." });
            return;
        }

        if (hasFile && hasLink) {
            res.status(400).json({ error: "Provide only one: file or external link." });
            return;
        }

        let finalLink = "";

        if (req.file) {
            const uploaded = await uploadBuffer(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            finalLink = uploaded.path;
        } else {
            finalLink = link.trim();
        }

        const created = await prisma.content.create({
            data: {
                title: name,
                link: finalLink,
                ownerName: `${employee.firstName} ${employee.lastName}`,
                ownerId: employee.id,
                jobPosition,
                contentType,
                status,
                expirationDate: new Date(expirationDate),
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            content: created,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
});

export default router;
