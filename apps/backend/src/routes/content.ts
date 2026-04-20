import { unlink } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import {
    uploadBuffer,
    getSignedUrl,
    deleteFile,
} from "../lib/supabase.ts";
import pkg from "express-openid-connect";
import { prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";

import { ContentRepository } from "../ContentRepository.ts";
const contentRepo = new ContentRepository();

const router = Router();
const upload = multer();

type EmployeeWithPhoto = {
    id: number;
    userPhoto: { path: string } | null;
};

async function employeeWithProfileUrl<T extends EmployeeWithPhoto>(
    emp: T,
): Promise<Omit<T, "userPhoto"> & { profileImageUrl?: string }> {
    const { userPhoto, ...rest } = emp;
    let profileImageUrl: string | undefined;
    if (userPhoto?.path) {
        try {
            profileImageUrl = await getSignedUrl(userPhoto.path, 3600);
        } catch (err) {
            console.error("Profile image signed URL failed", emp.id, err);
        }
    }
    return { ...rest, profileImageUrl };
}

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

/** Check-ins abandoned after this duration (e.g. closed tab without releasing). */
const STALE_CHECKOUT_MS = 5 * 60 * 1000;

async function releaseStaleCheckouts(): Promise<void> {
    const cutoff = new Date(Date.now() - STALE_CHECKOUT_MS);
    await prisma.content.updateMany({
        where: {
            isCheckedOut: true,
            checkedOutOn: { lte: cutoff },
        },
        data: {
            isCheckedOut: false,
            checkedOutById: null,
            checkedOutOn: null,
        },
    });
}

// ===================================
// GET ===============================
// ===================================

router.get("/", requiresAuth(), async (req, res) => {
    await releaseStaleCheckouts();
    const contents = await contentRepo.getAll();
    const enriched = await Promise.all(
        contents.map(async (c) => {
            if (!c.checkedOutBy) {
                return { ...c, checkedOutBy: null };
            }
            const mapped = await employeeWithProfileUrl(c.checkedOutBy);
            return { ...c, checkedOutBy: mapped };
        }),
    );
    res.json(enriched);
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
            checkedOutOn: null,
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
            checkedOutOn: new Date(),
        },
        include: {
            owner: true,
            checkedOutBy: { include: { userPhoto: true } },
        },
    });

    const checkedOutBy = updated.checkedOutBy
        ? await employeeWithProfileUrl(updated.checkedOutBy)
        : null;
    res.json({
        success: true,
        content: { ...updated, checkedOutBy },
    });
});

// ===================================
// PUT ===============================
// ===================================
router.put("/upload/:id", requiresAuth(), upload.single("file"), async (req, res) => {
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

        const isJobPosition = content.jobPositions.includes(employee.jobPosition);
        const isAdmin = employee.jobPosition === "admin";

        if (!isJobPosition && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to check in this content" });
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
                isCheckedOut: false,
                checkedOutById: null,
                checkedOutOn: null,
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

router.delete("/:id", requiresAuth(), async (req, res) => {
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
            res.status(404).json({ error: "Content not found" });
            return;
        }

        if (content.isCheckedOut) {
            res.status(409).json({ error: "Cannot delete while document is checked out" });
            return;
        }

        const isOwner = content.ownerId === employee.id;
        const isAdmin = employee.jobPosition === "admin";
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: "Not authorized to delete this content" });
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

// ===================================
// POST (Tag to content)
// ===================================
router.post("/:contentId/tags/:tagId", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const contentId = Number(req.params.contentId);
        const tagId = Number(req.params.tagId);

        if (Number.isNaN(contentId) || Number.isNaN(tagId)) {
            res.status(400).json({ error: "Invalid content id or tag id" });
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

        const content = await contentRepo.getById(contentId);
        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }

        const contentTag = await contentRepo.addTag(contentId, tagId);

        res.json({
            success: true,
            contentTag,
        });
    } catch (err: any) {
        console.error(err);

        if (err.code === "P2002") {
            res.status(409).json({
                error: "That tag is already attached to this content",
            });
            return;
        }

        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to attach tag",
        });
    }
});

// ===================================
// DELETE (Tag from content)
// ===================================
router.delete("/:contentId/tags/:tagId", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const contentId = Number(req.params.contentId);
        const tagId = Number(req.params.tagId);

        if (Number.isNaN(contentId) || Number.isNaN(tagId)) {
            res.status(400).json({ error: "Invalid content id or tag id" });
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

        const content = await contentRepo.getById(contentId);
        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }

        await contentRepo.removeTag(contentId, tagId);

        res.json({ success: true });
    } catch (err: any) {
        console.error(err);

        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to remove tag from content",
        });
    }
});

// ===================================
// GET (All tags for one content item)
// ===================================
router.get("/:contentId/tags", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const contentId = Number(req.params.contentId);

        if (Number.isNaN(contentId)) {
            res.status(400).json({ error: "Invalid content id" });
            return;
        }

        const content = await contentRepo.getTags(contentId);

        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }

        const tags = content.tags.map((ct) => ct.tag);

        res.json({
            success: true,
            tags,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load tags",
        });
    }
});

export default router;


