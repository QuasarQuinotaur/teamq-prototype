import { unlink } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";

import {
    uploadBuffer,
    getSignedUrl,
} from "../lib/supabase.ts";
import pkg from "express-openid-connect";
import { prisma, type Prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";
import type express from "express";

import { ContentRepository } from "../ContentRepository.ts";
import { contentService } from "../services.ts";
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

function parseQueryStringList(
    q: express.Request["query"],
    key: string,
): string[] {
    const v = q[key];
    if (v === undefined) return [];
    if (Array.isArray(v)) {
        return v
            .flatMap((s) => String(s).split(","))
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return String(v)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseQueryIdList(
    q: express.Request["query"],
    key: string,
): number[] {
    return parseQueryStringList(q, key)
        .map((s) => Number(s))
        .filter((n) => !Number.isNaN(n));
}

function queryTruthy(q: express.Request["query"], key: string): boolean {
    const v = q[key];
    if (v === undefined) return false;
    const s = Array.isArray(v) ? v[0] : v;
    return s === "1" || s === "true" || s === "yes";
}

/** Extension keys must match `DOCUMENT_TYPE_MAP` in frontend `constants.tsx` (excluding links/files). */
const DOCUMENT_EXTENSION_FILTER_KEYS = new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "csv",
    "ppt",
    "pptx",
    "txt",
    "rtf",
    "odt",
    "ods",
    "odp",
]);

function whereDocumentTypes(
    documentTypes: string[],
): Prisma.ContentWhereInput | null {
    const parts: Prisma.ContentWhereInput[] = [];
    if (documentTypes.includes("links")) {
        parts.push({ filePath: { startsWith: "http" } });
    }
    if (documentTypes.includes("files")) {
        parts.push({
            AND: [
                { filePath: { not: null } },
                { NOT: { filePath: { startsWith: "http" } } },
            ],
        });
    }
    for (const dt of documentTypes) {
        if (DOCUMENT_EXTENSION_FILTER_KEYS.has(dt)) {
            parts.push({
                AND: [
                    { filePath: { not: null } },
                    {
                        filePath: {
                            endsWith: `.${dt}`,
                            mode: "insensitive",
                        },
                    },
                ],
            });
        }
    }
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0]!;
    return { OR: parts };
}

type ContentListOrder =
    | {
          kind: "prisma";
          orderBy:
              | Prisma.ContentOrderByWithRelationInput
              | Prisma.ContentOrderByWithRelationInput[];
      }
    | { kind: "jobPosition"; ascending: boolean };

type ParsedListQuery = {
    where: Prisma.ContentWhereInput;
    order: ContentListOrder;
};

/**
 * If `query` is empty, legacy clients get the full list ordered by id (e.g. admin check-in, dev).
 * Otherwise, optional filter/sort come from the query string.
 */
function parseContentListQuery(
    query: express.Request["query"],
    employee: { id: number } | null,
): ParsedListQuery | { legacyNoQuery: true } {
    if (Object.keys(query).length === 0) {
        return { legacyNoQuery: true };
    }

    const ands: Prisma.ContentWhereInput[] = [];

    const onlyFavorites = queryTruthy(query, "onlyFavorites");
    const onlyMine = queryTruthy(query, "onlyMine");
    const onlyMyCheckouts = queryTruthy(query, "onlyMyCheckouts");

    if (onlyFavorites) {
        if (!employee) {
            throw new Error("UNAUTHORIZED_EMPLOYEE");
        }
        ands.push({
            employeesFavorited: { some: { id: employee.id } },
        });
    }
    if (onlyMine) {
        if (!employee) {
            throw new Error("UNAUTHORIZED_EMPLOYEE");
        }
        ands.push({ ownerId: employee.id });
    }
    if (onlyMyCheckouts) {
        if (!employee) {
            throw new Error("UNAUTHORIZED_EMPLOYEE");
        }
        ands.push({
            isCheckedOut: true,
            checkedOutById: employee.id,
        });
    }

    const contentTypes = parseQueryStringList(query, "contentTypes");
    if (contentTypes.length > 0) {
        ands.push({ contentType: { in: contentTypes } });
    }
    const jobPositions = parseQueryStringList(query, "jobPositions");
    if (jobPositions.length > 0) {
        ands.push({ jobPositions: { hasSome: jobPositions } });
    }
    const tagIds = parseQueryIdList(query, "tagIds");
    if (tagIds.length > 0) {
        ands.push({
            tags: { some: { tagId: { in: tagIds } } },
        });
    }
    const documentTypes = parseQueryStringList(query, "documentTypes");
    const docWhere = whereDocumentTypes(documentTypes);
    if (docWhere) ands.push(docWhere);

    const qRaw = query["q"];
    const q = typeof qRaw === "string" ? qRaw.trim() : "";
    if (q.length > 0) {
        ands.push({ title: { contains: q, mode: "insensitive" } });
    }

    const where: Prisma.ContentWhereInput =
        ands.length > 0 ? { AND: ands } : {};

    const sortBy = parseQueryStringList(query, "sortBy")[0] ?? "title";
    const sortMethod =
        parseQueryStringList(query, "sortMethod")[0] ?? "ascending";
    const desc = sortMethod === "descending";
    const ord = (field: "title" | "contentType" | "expirationDate") =>
        [
            { [field]: desc ? "desc" : "asc" } as Prisma.ContentOrderByWithRelationInput,
            { title: "asc" },
        ] satisfies Prisma.ContentOrderByWithRelationInput[];

    let order: ContentListOrder;
    if (sortBy === "contentType") {
        order = { kind: "prisma", orderBy: ord("contentType") };
    } else if (sortBy === "expirationDate") {
        order = { kind: "prisma", orderBy: ord("expirationDate") };
    } else if (sortBy === "jobPosition") {
        order = { kind: "jobPosition", ascending: !desc };
    } else {
        // title (default) or unknown
        order = {
            kind: "prisma",
            orderBy: { title: desc ? "desc" : "asc" },
        };
    }

    return { where, order };
}

type ContentListRow = Awaited<
    ReturnType<typeof contentRepo.listWithFilters>
>[number];

/**
 * In-memory job position sort, mirroring the browser (sorted positions joined by comma, then title).
 */
function sortContentsByJobPosition(
    rows: ContentListRow[],
    ascending: boolean,
): ContentListRow[] {
    const mult = ascending ? 1 : -1;
    return [...rows].sort((a, b) => {
        const sa = [...a.jobPositions].sort().join(",");
        const sb = [...b.jobPositions].sort().join(",");
        const c = sa.localeCompare(sb);
        if (c !== 0) return c * mult;
        return mult * a.title.localeCompare(b.title);
    });
}

// ===================================
// GET ===============================
// ===================================

router.get("/", requiresAuth(), async (req, res) => {
    try {
        await releaseStaleCheckouts();
        const employee = await getEmployeeFromRequest(req);

        let contents: Awaited<ReturnType<typeof contentRepo.listWithFilters>>;

        const parsed = parseContentListQuery(req.query, employee);
        if ("legacyNoQuery" in parsed) {
            contents = await contentRepo.getAll();
        } else {
            if (parsed.order.kind === "prisma") {
                contents = await contentRepo.listWithFilters(
                    parsed.where,
                    parsed.order.orderBy,
                );
            } else {
                const unsorted = await contentRepo.listWithFilters(parsed.where, {
                    id: "asc",
                });
                contents = sortContentsByJobPosition(
                    unsorted,
                    parsed.order.ascending,
                );
            }
        }

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
    } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHORIZED_EMPLOYEE") {
            res.status(400).json({
                error: "Employee record required for this request",
            });
            return;
        }
        res.status(500).json({ error: err });
    }
});


router.get("/:id", requiresAuth(), async (req, res) => { // get content
    const id = Number(req.params.id);
    const employee = await getEmployeeFromRequest(req);
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
        await prisma.ActivityLog.create({
            data: {
                employeeId: employee.id,
                contentId: id,
                type: "View"
            }
        });
        res.json({ content: content });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.get("/:id/download", requiresAuth(), async (req, res) => { // get download url for content
    const id = Number(req.params.id);
    const employee = await getEmployeeFromRequest(req);
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
    await prisma.ActivityLog.create({
        data: {
            employeeId: employee.id,
            contentId: id,
            type: "Download"
        }
    });
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
        await prisma.ActivityLog.create({
            data: {
                employeeId: employee.id,
                contentId: created.id,
                type: "Upload"
            }
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
    await prisma.ActivityLog.create({
        data: {
            employeeId: employee.id,
            contentId: id,
            type: "Checked In"
        }
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
    await prisma.ActivityLog.create({
        data: {
            employeeId: employee.id,
            contentId: id,
            type: "Checked Out"
        }
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

        const { name, link, expirationDate, contentType, newOwnerID } = req.body;

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

        const isOwner = content.ownerId === employee.id;
        const parsedNewOwnerId = newOwnerID ? Number(newOwnerID) : undefined;

        if (parsedNewOwnerId && parsedNewOwnerId !== content.ownerId) {
            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    error: "Only the current owner or admin can change ownership",
                });
            }
        }

        if (parsedNewOwnerId) {
            const newOwner = await prisma.employee.findUnique({
                where: { id: parsedNewOwnerId },
            });

            if (!newOwner) {
                return res.status(400).json({ error: "New owner does not exist" });
            }
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
                jobPositions,
                contentType: contentType.trim(),
                expirationDate: new Date(expirationDate),
                isCheckedOut: false,
                checkedOutById: null,
                checkedOutOn: null,
                ...(newOwnerID && { ownerId: Number(newOwnerID) }),
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            content: updated,
        });
        await prisma.ActivityLog.create({
            data: {
                employeeId: employee.id,
                contentId: id,
                type: "Updated"
            }
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
// TODONE make it ref the service instead

router.delete("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        res.status(400).json({error: "Invalid id"});
        return;
    }

    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            return res.status(404).json({error: "No linked employee account found"});
        }
        await contentService.deleteContent(id, employee);

        const thumbFsPath = path.join(process.cwd(), "tmp", "thumbnails", `${id}.png`);
        await unlink(thumbFsPath).catch(() => {});

        res.json({ success: true });
        await prisma.ActivityLog.create({
            data: {
                employeeId: employee.id,
                contentId: id,
                type: "Deleted",
                contentTitle: req.params.title,
                contentType: req.params.contentType,
            }
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Delete failed";
        if (message === "Content not found") {
            return res.status(404).json({ error: message });
        }
        if (
            message === "Check out the document before deleting." ||
            message === "Not authorized to delete this content"
        ) {
            return res.status(403).json({ error: message });
        }
        if (message === "Cannot delete while document is checked out by another user") {
            return res.status(409).json({ error: message });
        }

        console.error(err);
        res.status(500).json({ error: message });
    }
});

// router.delete("/:id", requiresAuth(), async (req, res) => {
//     const id = Number(req.params.id);
//     if (isNaN(id)) {
//         res.status(400).json({ error: "Invalid id" });
//         return;
//     }
//
//     try {
//         const employee = await getEmployeeFromRequest(req);
//         if (!employee) {
//             res.status(404).json({ error: "No linked employee account found" });
//             return;
//         }
//
//         const content = await contentRepo.getById(id);
//
//         if (!content) {
//             res.status(404).json({ error: "Content not found" });
//             return;
//         }
//
//         if (content.isCheckedOut) {
//             res.status(409).json({ error: "Cannot delete while document is checked out" });
//             return;
//         }
//
//         const isOwner = content.ownerId === employee.id;
//         const isAdmin = employee.jobPosition === "admin";
//         if (!isOwner && !isAdmin) {
//             res.status(403).json({ error: "Not authorized to delete this content" });
//             return;
//         }
//
//         const filePath = content.filePath;
//         const isExternalLink =
//             !!filePath &&
//             (filePath.startsWith("http://") || filePath.startsWith("https://"));
//
//         if (filePath && !isExternalLink) {
//             await deleteFile(filePath);
//         }
//
//         await contentRepo.delete(id);
//
//         const thumbFsPath = path.join(process.cwd(), "tmp", "thumbnails", `${id}.png`);
//         await unlink(thumbFsPath).catch(() => {});
//
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             error: err instanceof Error ? err.message : "Delete failed",
//         });
//     }
// });

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

        const tag = await prisma.Tag.findFirst({
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
// DELETE (Tag from content)==========
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


