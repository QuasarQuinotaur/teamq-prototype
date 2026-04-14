import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import { uploadBuffer, getSignedUrl, deleteFile } from "../lib/supabase.ts";
import pkg from "express-openid-connect";
import { prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";

import { ContentRepository } from "../ContentRepository.ts";
const contentRepo = new ContentRepository();

const router = Router();
const upload = multer();

// ===================================
// GET ===============================
// ===================================

router.get("/", requiresAuth(), async (req, res) => { // get all contents
    const employee = await getEmployeeFromRequest(req);
    const jobPosition = employee?.jobPosition;

    const contents = jobPosition === 'admin'
        ? await contentRepo.getAll()
        : await contentRepo.getByJobPosition(jobPosition ?? '');

    res.json(contents);
});

router.get("/:id/download", requiresAuth(), async (req, res) => { // get download url for content
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const content = await contentRepo.getById(id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const signedUrl = await getSignedUrl(content.link);
        res.json({ url: signedUrl });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate download URL" });
    }
});


// ====================================
// POST ===============================
// ====================================

router.post("/upload", requiresAuth(), upload.single("file"), async (req, res) => { // create new content
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

// ===================================
// PUT ===============================
// ===================================

router.put("/upload/:id", requiresAuth(), upload.single("file"), async (req, res) => { // update content
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }

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

        const created = await prisma.content.update({
            where: { id: id },
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


// ======================================
// DELETE ===============================
// ======================================

router.delete("/:id", requiresAuth(), async (req, res) => { // delete content
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }

    try {
        const content = await contentRepo.getById(id);

        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }

        const isExternalLink =
            content.link.startsWith("http://") || content.link.startsWith("https://");

        if (!isExternalLink) {
            await deleteFile(content.link);
        }

        await contentRepo.delete(id);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Delete failed",
        });
    }
});


export default router;


