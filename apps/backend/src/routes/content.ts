import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import {
    uploadBuffer,
    getSignedUrl,
    deleteFile,
    downloadBuffer,
} from "../lib/supabase.ts";
import { pdf } from "pdf-to-img";
import pkg from "express-openid-connect";
import { prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";

import { ContentRepository } from "../ContentRepository.ts";
const contentRepo = new ContentRepository();

const router = Router();
const upload = multer();

/** Multipart bodies send strings; accept JSON array, comma-separated, or legacy single `jobPosition`. */
function parseJobPositions(body: Record<string, unknown>): string[] | null {
    const raw = body.jobPositions;
    if (typeof raw === "string" && raw.trim()) {
        try {
            const parsed: unknown = JSON.parse(raw);
            if (
                Array.isArray(parsed) &&
                parsed.every((x) => typeof x === "string" && x.trim())
            ) {
                return parsed.map((x: string) => x.trim()).filter(Boolean);
            }
        } catch {
            return raw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }
    }
    if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
        return raw.map((s) => String(s).trim()).filter(Boolean);
    }
    const single = body.jobPosition;
    if (typeof single === "string" && single.trim()) {
        return [single.trim()];
    }
    return null;
}

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
        const filePath = content.filePath;
        if (!filePath?.trim()) {
            res.status(404).json({ error: "No file or link" });
            return;
        }
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            res.json({ url: filePath });
            return;
        }
        const signedUrl = await getSignedUrl(filePath);
        res.json({ url: signedUrl });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate download URL" });
    }
});

router.get("/:id/thumbnail", requiresAuth(), async (req, res) => {
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
        const storagePath = content.filePath;
        if (
            !storagePath?.trim() ||
            storagePath.startsWith("http://") ||
            storagePath.startsWith("https://")
        ) {
            res.json({ thumbnailUrl: null });
            return;
        }
        if (!storagePath.toLowerCase().endsWith(".pdf")) {
            res.json({ thumbnailUrl: null });
            return;
        }

        const thumbRel = `/tmp/thumbnails/${id}.png`;
        const thumbFsPath = path.join(process.cwd(), "tmp", "thumbnails", `${id}.png`);

        let needsWrite = true;
        try {
            await stat(thumbFsPath);
            needsWrite = false;
        } catch {
            needsWrite = true;
        }

        if (needsWrite) {
            await mkdir(path.dirname(thumbFsPath), { recursive: true });
            const buf = await downloadBuffer(storagePath);
            const doc = await pdf(buf, { scale: 0.85 });
            const firstPage = await doc.getPage(1);
            await writeFile(thumbFsPath, firstPage);
        }

        res.json({ thumbnailUrl: thumbRel });
    } catch (err) {
        console.error("Thumbnail generation failed", err);
        res.json({ thumbnailUrl: null });
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

        const { name, link, expirationDate, contentType } = req.body;

        const jobPositions = parseJobPositions(req.body as Record<string, unknown>);
        if (
            !name?.trim() ||
            !jobPositions?.length ||
            !expirationDate ||
            !contentType?.trim()
        ) {
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
                title: name.trim(),
                filePath: finalLink,
                fileSize: req.file?.size,
                jobPositions,
                contentType: contentType.trim(),
                expirationDate: new Date(expirationDate),
                ownerId: employee.id,
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

//for manual check in incase some one forgets (maybe after like a week?)
//or if you want to check in without upload
router.post("/checkin/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        return res.status(404).json({ error: "No linked employee account found" });
    }

    const content = await contentRepo.getById(id);

    if (!content) {
        return res.status(404).json({ error: "Not found" });
    }

    //allow if owner or admin
    const isJobPosition = content.jobPositions.includes(employee.jobPosition);
    const isAdmin = employee.jobPosition === "admin";

    if (!isJobPosition && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to check in this content" });
    }

    await prisma.content.update({
        where: { id },
        data: {
            isCheckedOut: false,
            checkedOutById: null,
        },
    });

    res.json({ success: true });
});

router.post("/checkout/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }

    const employee = await getEmployeeFromRequest(req);
    if (!employee) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }

    const content = await contentRepo.getById(id);
    if (!content) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const isJobPosition = content.jobPositions.includes(employee.jobPosition);
    const isAdmin = employee.jobPosition === "admin";
    if (!isJobPosition && !isAdmin) {
        res.status(403).json({ error: "Not authorized to check out this content" });
        return;
    }

    if (content.isCheckedOut && content.checkedOutById !== employee.id) {
        res.status(409).json({ error: "Content is already checked out by another user" });
        return;
    }

    const updated = await prisma.content.update({
        where: { id },
        data: {
            isCheckedOut: true,
            checkedOutById: employee.id,
        },
        include: {
            owner: true,
            checkedOutBy: true,
        },
    });

    res.json({ success: true, content: updated });
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

        const content = await contentRepo.getById(id);

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        if (content.isCheckedOut && content.checkedOutById !== employee.id) {
            return res.status(403).json({ error: "Content is checked out by another user" });
        }

        const { name, link, expirationDate, contentType } = req.body;

        const jobPositions = parseJobPositions(req.body as Record<string, unknown>);
        if (
            !name?.trim() ||
            !jobPositions?.length ||
            !expirationDate ||
            !contentType?.trim()
        ) {
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

        const updated = await prisma.content.update({
            where: { id: id },
            data: {
                title: name.trim(),
                filePath: finalLink,
                fileSize: req.file?.size ?? undefined,
                ownerId: employee.id,
                jobPositions,
                contentType: contentType.trim(),
                expirationDate: new Date(expirationDate),
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            content: updated,
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

        const filePath = content.filePath;
        const isExternalLink =
            !!filePath &&
            (filePath.startsWith("http://") || filePath.startsWith("https://"));

        if (filePath && !isExternalLink) {
            await deleteFile(filePath);
        }

        await contentRepo.delete(id);

        const thumbFsPath = path.join(process.cwd(), "tmp", "thumbnails", `${id}.png`);
        await unlink(thumbFsPath).catch(() => {});

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Delete failed",
        });
    }
});


export default router;


