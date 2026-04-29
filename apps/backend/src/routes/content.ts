import { unlink } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";

import {
    uploadBuffer,
    getSignedUrl,
    tryGetSignedUrl,
    downloadBuffer,
} from "../lib/supabase.ts";
import {
    MAX_SUMMARY_BYTES,
    suggestTagIdsFromContent,
    summarizeContentBuffer,
    SummaryBadRequestError,
    SummaryTooLargeError,
    SummaryUnsupportedError,
} from "../lib/documentSummary.ts";
import {
    APIError,
    AuthenticationError,
    BadRequestError,
    RateLimitError,
} from "@anthropic-ai/sdk";
import pkg from "express-openid-connect";
import { prisma, type Prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";
import type express from "express";

import { ContentRepository } from "../ContentRepository.ts";
import {
    notifyDocumentEditedByOther,
    notifyOwnerOnDocumentAccess,
    notifyOwnershipTransferred,
} from "../contentNotificationTriggers.ts";
import { contentService, notificationRepo } from "../services.ts";
import { getEmployeeIsAdmin } from "../util.ts";
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
        profileImageUrl = await tryGetSignedUrl(userPhoto.path, 3600);
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
    rawSortBy: string;
    desc: boolean;
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

    const rawSortBy = parseQueryStringList(query, "sortBy")[0]
    const sortBy = rawSortBy ?? "title";
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

    return { where, order, rawSortBy, desc };
}


type ParsedRecentListQuery = {
    where: Prisma.RecentContentViewWhereInput;
    order?: ContentListOrder | boolean;
};

/**
 * If `query` is empty, legacy clients get the full list ordered by id (e.g. admin check-in, dev).
 * Otherwise, optional filter/sort come from the query string.
 */
function parseRecentListQuery(
    query: express.Request["query"],
    employee: { id: number } | null,
): ParsedRecentListQuery | { legacyNoQuery: true } {
    const includeTutorialDocuments = queryTruthy(
        query,
        "includeTutorialDocuments",
    );
    const contentQuery = parseContentListQuery(query, employee)
    if ("legacyNoQuery" in contentQuery) {
        return contentQuery
    }

    const baseWhere = contentQuery.where;
    const contentWhereMerged: Prisma.ContentWhereInput =
        includeTutorialDocuments
            ? baseWhere
            : Object.keys(baseWhere).length === 0
              ? { isTutorial: false }
              : { AND: [baseWhere, { isTutorial: false }] };

    const where: Prisma.RecentContentViewWhereInput = {
        Content: contentWhereMerged,
    }

    let order: ContentListOrder | boolean = null
    const contentOrder = contentQuery.order
    const contentSortBy = contentQuery.rawSortBy
    const contentDescending = contentQuery.desc
    if (contentSortBy && contentSortBy.trim() && contentSortBy !== "lastViewedAt") {
        // No ordering if lastViewedAt or unspecified
        order = contentOrder
    } else {
        order = contentDescending
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

type RecentListRow = Awaited<
    ReturnType<typeof contentRepo.getRecentViews>
>[number];

function sortRecentsByJobPosition(
    rows: RecentListRow[],
    ascending: boolean
): RecentListRow[] {
    const mult = ascending ? 1 : -1;
    return [...rows].sort((a, b) => {
        const ca = a.Content
        const cb = b.Content
        const sa = [...ca.jobPositions].sort().join(",");
        const sb = [...cb.jobPositions].sort().join(",");
        const c = sa.localeCompare(sb);
        if (c !== 0) return c * mult;
        return mult * ca.title.localeCompare(cb.title);
    });
}


//===============================
//Post (Content marked as viewed)
//===============================
router.post("/:contentId/view", requiresAuth(), async (req, res) => {
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

        const content = await contentRepo.getById(contentId);
        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }

        await Promise.all([
            contentRepo.recordView(employee.id, contentId),
            prisma.content.update({
                where: { id: contentId },
                data: { viewCount: { increment: 1 } },
            }),
        ]);

        await contentRepo.recordView(employee.id, contentId);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to record view",
        });
    }
});


//===================================
//GET (recently viewed documents)====
//===================================
router.get("/recent", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const limit = Number(req.query.limit);
        const take = Number.isNaN(limit) ? 10 : Math.min(Math.max(limit, 1), 50);

        let recent: Awaited<ReturnType<typeof contentRepo.getRecentViews>>;

        const parsed = parseRecentListQuery(req.query, employee);
        if ("legacyNoQuery" in parsed) {
            recent = await contentRepo.getRecentViews(employee.id, take);
        } else {
            if (parsed.order === null) {
                recent = await contentRepo.getRecentViews(employee.id, take, parsed.where);
            } else if (typeof parsed.order === "boolean") {
                recent = await contentRepo.getRecentViews(employee.id, take, parsed.where, {
                    lastViewedAt: parsed.order ? "asc" : "desc"
                });
            } else if (parsed.order.kind === "prisma") {
                let orderBy:
                    | Prisma.RecentContentViewOrderByWithRelationInput
                    | Prisma.RecentContentViewOrderByWithRelationInput[] = null
                const contentOrderBy = parsed.order.orderBy
                if (Array.isArray(contentOrderBy)) {
                    orderBy = contentOrderBy.map((order) => {
                        return {Content: order}
                    })
                } else {
                    orderBy = {Content: contentOrderBy}
                }
                recent = await contentRepo.getRecentViews(employee.id, take, parsed.where, orderBy);
            } else {
                const unsorted = await contentRepo.getRecentViews(employee.id, take, parsed.where);
                recent = sortRecentsByJobPosition(unsorted, parsed.order.ascending)
            }
        }

        res.json({
            success: true,
            recent: recent.map((row) => ({
                lastViewedAt: row.lastViewedAt,
                content: row.Content,
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load recent documents",
        });
    }
});

// ===================================
// GET ===============================
// ===================================

router.get("/", requiresAuth(), async (req, res) => {
    try {
        await releaseStaleCheckouts();
        const employee = await getEmployeeFromRequest(req);

        let contents: Awaited<ReturnType<typeof contentRepo.listWithFilters>>;

        const parsed = parseContentListQuery(req.query, employee);
        const onlyMine = queryTruthy(req.query, "onlyMine");
        const onlyMyCheckouts = queryTruthy(req.query, "onlyMyCheckouts");
        /** Tutorial UI sends `includeTutorialDocuments=1` so My content / Checked out lists owned tutorial rows; main app omits it. */
        const includeTutorialDocuments = queryTruthy(
            req.query,
            "includeTutorialDocuments",
        );
        const mineOpts =
            employee && (onlyMine || onlyMyCheckouts)
                ? {
                      mineListOwnerId: employee.id,
                      includeTutorialMine: includeTutorialDocuments,
                  }
                : undefined;
        if ("legacyNoQuery" in parsed) {
            contents = await contentRepo.getAll();
        } else {
            if (parsed.order.kind === "prisma") {
                contents = await contentRepo.listWithFilters(
                    parsed.where,
                    parsed.order.orderBy,
                    mineOpts,
                );
            } else {
                const unsorted = await contentRepo.listWithFilters(
                    parsed.where,
                    {
                        id: "asc",
                    },
                    mineOpts,
                );
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

// Returns the top N most downloaded content items, sorted by downloadCount descending.
// Use the ?limit= query param to control how many results come back (default 5).
router.get("/stats/top", requiresAuth(), async (req, res) => {
    const limit = Number(req.query.limit) || 5;
    try {
        const top = await prisma.content.findMany({
            orderBy: { downloadCount: "desc" },
            take: limit,
            select: { id: true, title: true, viewCount: true, downloadCount: true }
        });
        res.json({ top });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.get("/expirations", requiresAuth(), async (req, res) => {
    try {
        const contents = await prisma.content.findMany({
            include: {
                owner: {
                    include: {
                        userPhoto: true,
                    },
                },
            },
        });

        const expirations = await Promise.all(
            contents.map(async (c) => {
                const ownerWithUrl = c.owner
                    ? await employeeWithProfileUrl(c.owner)
                    : null;

                return {
                    id: c.id,
                    title: c.title,
                    expirationDate: c.expirationDate,
                    owner: ownerWithUrl,
                };
            })
        );

        res.json(expirations);
    } catch (err) {
        console.error("Failed to fetch expirations:", err);
        res.status(500).json({ error: "Failed to fetch expirations" });
    }
});

router.get("/currency", requiresAuth(), async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 20;
        const contents = await prisma.content.findMany({
            orderBy: { dateUpdated: "desc" },
            take: limit,
            select: {
                id: true,
                title: true,
                contentType: true,
                dateAdded: true,
                dateUpdated: true,
                owner: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
        res.json({ contents });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch currency data" });
    }
});

router.get("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    const employee = await getEmployeeFromRequest(req);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const employee = await getEmployeeFromRequest(req);
        const content = await contentRepo.getById(id, employee?.id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        await prisma.activityLog.create({
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

router.get("/:id/download", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    const employee = await getEmployeeFromRequest(req);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const employee = await getEmployeeFromRequest(req);
        const content = await contentRepo.getById(id, employee?.id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        void notifyOwnerOnDocumentAccess(content).catch((err) =>
            console.error("notifyOwnerOnDocumentAccess", err),
        );
        const filePath = content.filePath;
        if (!filePath?.trim()) {
            res.status(404).json({ error: "No file or link" });
            return;
        }
        await prisma.content.update({
            where: { id },
            data: { downloadCount: { increment: 1 } }
        });
        const url =
            filePath.startsWith("http://") || filePath.startsWith("https://")
                ? filePath
                : await getSignedUrl(filePath);
        void prisma.activityLog
            .create({
                data: {
                    employeeId: employee.id,
                    contentId: id,
                    type: "Download",
                },
            })
            .catch((e) => console.error("activityLog download", e));
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate download URL" });
    }
});

router.get("/:id/file-url", requiresAuth(), async (req, res) => {
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
        const content = await contentRepo.getById(id, employee.id);
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
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate URL" });
    }
});

function mapSummaryErrorToMessage(err: unknown): string {
    if (err instanceof SummaryUnsupportedError) {
        return err.message;
    }
    if (err instanceof SummaryTooLargeError) {
        return err.message;
    }
    if (err instanceof SummaryBadRequestError) {
        return err.message;
    }
    if (err instanceof AuthenticationError) {
        return "Summarization service is not configured (invalid Anthropic API key).";
    }
    if (err instanceof RateLimitError) {
        return "Summarization rate limited. Try again in a moment.";
    }
    if (err instanceof BadRequestError) {
        return (
            err.message ||
            "The summarization service rejected this request (e.g. model or document format)."
        );
    }
    if (err instanceof APIError && err.status != null) {
        if (err.status >= 500) {
            return "Summarization failed. Try again later.";
        }
        return err.message || "Summarization request failed.";
    }
    const message = err instanceof Error ? err.message : "Summarization failed";
    if (
        message.includes("ANTHROPIC_API_KEY") ||
        message.includes("not configured")
    ) {
        return "Summarization service is not configured.";
    }
    return message || "Summarization failed. Try again later.";
}

function tagVisibleWhere(employeeId: number): Prisma.TagWhereInput {
    return {
        OR: [{ ownerId: employeeId }, { isGlobal: true }],
    };
}

// Returns viewCount and downloadCount for a specific content item.
// Frontend can use either or both fields — just ignore what you don't need.
router.get("/:id/stats", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const content = await prisma.content.findUnique({
            where: { id },
            select: { viewCount: true, downloadCount: true },
        });
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({
            viewCount: content.viewCount,
            downloadCount: content.downloadCount,
        });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.post("/:id/suggest-tags", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    console.log("[tagSuggest] POST /api/content/:id/suggest-tags start", {
        contentId: id,
    });
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const content = await contentRepo.getById(id, employee.id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        void notifyOwnerOnDocumentAccess(content).catch((err) =>
            console.error("notifyOwnerOnDocumentAccess", err),
        );

        const filePath = content.filePath;
        if (!filePath?.trim()) {
            res.status(404).json({ error: "No file or link" });
            return;
        }
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            res.status(400).json({
                error: "AI tag suggestions are only available for uploaded files in the app, not external links.",
            });
            return;
        }

        if (
            content.fileSize != null &&
            content.fileSize > MAX_SUMMARY_BYTES
        ) {
            res.status(413).json({
                error: `Document exceeds the ${MAX_SUMMARY_BYTES / (1024 * 1024)} MB limit for AI tag suggestions.`,
            });
            return;
        }

        const candidateTags = await prisma.tag.findMany({
            where: tagVisibleWhere(employee.id),
            orderBy: [{ tagName: "asc" }],
            select: { id: true, tagName: true },
        });

        if (candidateTags.length === 0) {
            res.status(400).json({
                error: "No tags are available to assign. Create a tag first.",
            });
            return;
        }

        const contentWithTags = await contentRepo.getTags(id);
        const existingTagIds = new Set(
            (contentWithTags?.tags ?? []).map((ct) => ct.tagId),
        );

        const buffer = await downloadBuffer(filePath);
        const filename =
            path.basename(filePath.split("?")[0] || "") || `content-${id}`;

        let suggested: number[];
        try {
            suggested = await suggestTagIdsFromContent({
                buffer,
                filename,
                title: content.title,
                candidateTags,
            });
        } catch (suggestErr) {
            const msg = mapSummaryErrorToMessage(suggestErr);
            console.error("[tagSuggest] suggestTagIdsFromContent failed", suggestErr);
            res.status(500).json({ error: msg });
            return;
        }

        const tagIds = suggested.filter((tagId) => !existingTagIds.has(tagId));

        console.log("[tagSuggest] POST /api/content/:id/suggest-tags ok", {
            contentId: id,
            offered: tagIds.length,
        });
        res.json({ success: true, tagIds });
    } catch (err) {
        console.error("POST /content/:id/suggest-tags", err);
        res.status(500).json({
            error:
                err instanceof Error ? err.message : "Failed to suggest tags",
        });
    }
});

router.post("/:id/summary", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const summaryReqStart = Date.now();
    console.log("[summary] POST /api/content/:id/summary start", { contentId: id });
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const content = await contentRepo.getById(id, employee.id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        void notifyOwnerOnDocumentAccess(content).catch((err) =>
            console.error("notifyOwnerOnDocumentAccess", err),
        );

        const filePath = content.filePath;
        if (!filePath?.trim()) {
            res.status(404).json({ error: "No file or link" });
            return;
        }
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            res.status(400).json({
                error: "AI summary is only available for uploaded files in the app, not external links.",
            });
            return;
        }

        if (
            content.fileSize != null &&
            content.fileSize > MAX_SUMMARY_BYTES
        ) {
            res.status(413).json({
                error: `Document exceeds the ${MAX_SUMMARY_BYTES / (1024 * 1024)} MB limit for summarization.`,
            });
            return;
        }

        const beginSummarySse = (): (() => void) => {
            // SSE + comment pings: keeps the socket busy during long Claude calls (Safari ~60s idle drops).
            res.status(200);
            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders();

            const pingMs = 12_000;
            const ping = setInterval(() => {
                try {
                    res.write(": ping\n\n");
                } catch {
                    clearInterval(ping);
                }
            }, pingMs);
            const stopPing = () => {
                clearInterval(ping);
            };
            req.on("close", stopPing);
            return stopPing;
        };

        const cached = content.aiSummary?.trim();

        const sendSummaryDone = (
            markdown: string,
            cacheHit: boolean,
        ): void => {
            console.log("[summary] POST /api/content/:id/summary ok", {
                contentId: id,
                totalMs: Date.now() - summaryReqStart,
                markdownChars: markdown.length,
                cacheHit,
            });
            res.write(
                `event: done\ndata: ${JSON.stringify({ markdown })}\n\n`,
            );
            res.end();
        };

        if (cached) {
            console.log("[summary] cache hit", { contentId: id });
            const stopPing = beginSummarySse();
            stopPing();
            req.removeListener("close", stopPing);
            sendSummaryDone(cached, true);
            return;
        }

        console.log("[summary] downloading from storage", {
            contentId: id,
            filePathSuffix: filePath.slice(-48),
        });
        const buffer = await downloadBuffer(filePath);
        const filename =
            path.basename(filePath.split("?")[0] || "") || `content-${id}`;
        console.log("[summary] storage download done", {
            contentId: id,
            bytes: buffer.length,
            filename,
        });

        const stopPing = beginSummarySse();

        try {
            const markdown = await summarizeContentBuffer({
                buffer,
                filename,
                title: content.title,
            });
            await prisma.content.update({
                where: { id },
                data: { aiSummary: markdown },
            });
            stopPing();
            req.removeListener("close", stopPing);
            sendSummaryDone(markdown, false);
        } catch (summarizeErr) {
            stopPing();
            req.removeListener("close", stopPing);
            const msg = mapSummaryErrorToMessage(summarizeErr);
            console.error("[summary] summarize failed", summarizeErr);
            try {
                res.write(
                    `event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`,
                );
            } catch {
                /* client disconnected */
            }
            res.end();
        }
    } catch (err) {
        if (res.headersSent) {
            console.error(
                "[summary] error after SSE headers sent (unexpected)",
                err,
            );
            try {
                if (!res.writableEnded) {
                    res.end();
                }
            } catch {
                /* ignore */
            }
            return;
        }
        console.error("POST /content/:id/summary (pre-stream)", err);
        res.status(500).json({
            error:
                err instanceof Error ? err.message : "Failed to prepare summarization",
        });
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

        const { name, link, expirationDate, contentType, isTutorial: isTutorialRaw } = req.body;

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

        const isTutorialFlag =
            isTutorialRaw === true ||
            isTutorialRaw === "true" ||
            isTutorialRaw === "1";

        const created = await prisma.content.create({
            data: {
                title: name.trim(),
                filePath: finalLink,
                fileSize: req.file?.size,
                jobPositions,
                contentType: contentType.trim(),
                expirationDate: new Date(expirationDate),
                ownerId: employee.id,
                isTutorial: isTutorialFlag,
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            content: created,
        });
        await prisma.activityLog.create({
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

    const content = await contentRepo.getById(id, employee.id);

    if (!content) {
        return res.status(404).json({ error: "Not found" });
    }

    //allow if owner or admin
    const isJobPosition = content.jobPositions.includes(employee.jobPosition);
    const isAdmin = await getEmployeeIsAdmin(employee);
    const isTutorialOwner =
        content.isTutorial && content.ownerId === employee.id;

    if (!isTutorialOwner && !isJobPosition && !isAdmin) {
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
    await prisma.activityLog.create({
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

    const content = await contentRepo.getById(id, employee.id);
    if (!content) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const isJobPosition = content.jobPositions.includes(employee.jobPosition);
    const isAdmin = await getEmployeeIsAdmin(employee);
    const isTutorialOwner =
        content.isTutorial && content.ownerId === employee.id;

    if (!isTutorialOwner && !isJobPosition && !isAdmin) {
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

    void notifyOwnerOnDocumentAccess(content).catch((err) =>
        console.error("notifyOwnerOnDocumentAccess", err),
    );

    const checkedOutBy = updated.checkedOutBy
        ? await employeeWithProfileUrl(updated.checkedOutBy)
        : null;
    res.json({
        success: true,
        content: { ...updated, checkedOutBy },
    });
    await prisma.activityLog.create({
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

        const content = await contentRepo.getById(id, employee.id);

        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }

        const isJobPosition = content.jobPositions.includes(employee.jobPosition);
        const isAdmin = await getEmployeeIsAdmin(employee);

        const isTutorialOwner =
            content.isTutorial && content.ownerId === employee.id;

        if (!isTutorialOwner && !isJobPosition && !isAdmin) {
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
        const previousOwnerId = content.ownerId;
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
                dateUpdated: new Date(Date.now()),
                hasBeenNotifiedExpiringSoon: false,
                hasBeenNotifiedOfExpiration: false,
                aiSummary: null,
                ...(newOwnerID && { ownerId: Number(newOwnerID) }),
            },
            include: {
                owner: true,
            },
        });

        try {
            if (employee.id !== previousOwnerId) {
                await notifyDocumentEditedByOther(
                    id,
                    name.trim(),
                    previousOwnerId,
                    employee,
                    notificationRepo,
                );
            }
            if (
                parsedNewOwnerId &&
                parsedNewOwnerId !== previousOwnerId &&
                content.owner
            ) {
                await notifyOwnershipTransferred(
                    id,
                    name.trim(),
                    parsedNewOwnerId,
                    content.owner,
                    notificationRepo,
                );
            }
        } catch (notifyErr) {
            console.error("content update notifications", notifyErr);
        }

        res.json({
            success: true,
            content: updated,
        });
        await prisma.activityLog.create({
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

        const contentToDelete = await prisma.content.findUnique({
            where: { id },
            select: { title: true, contentType: true },
        });

        await contentService.deleteContent(id, employee);

        if (contentToDelete) {
            await prisma.deletedContentLog.create({
                data: {
                    contentId: id,
                    title: contentToDelete.title,
                    contentType: contentToDelete.contentType,
                    deletedById: employee.id,
                },
            });
        }

        const thumbFsPath = path.join(process.cwd(), "tmp", "thumbnails", `${id}.png`);
        await unlink(thumbFsPath).catch(() => {});

        res.json({ success: true });
        await prisma.activityLog.create({
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
//         const isAdmin = await getEmployeeIsAdmin(employee);
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

        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                OR: [{ ownerId: employee.id }, { isGlobal: true }],
            },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        const content = await contentRepo.getById(contentId, employee.id);
        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }

        if (content.isTutorial && content.ownerId !== employee.id) {
            return res.status(403).json({ error: "Not authorized" });
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
                OR: [{ ownerId: employee.id }, { isGlobal: true }],
            },
        });

        if (!tag) {
            res.status(404).json({ error: "Tag not found" });
            return;
        }

        const content = await contentRepo.getById(contentId, employee.id);
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

//TUT ++++++==========================================
router.get("/tutorial", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            return res.status(404).json({ error: "No employee" });
        }

        const contents = await contentRepo.getTutorialContent(employee.id);
        res.json(contents);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.delete("/tutorial", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            return res.status(404).json({ error: "No employee" });
        }

        await contentRepo.deleteTutorialContent(employee.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});


export default router;


