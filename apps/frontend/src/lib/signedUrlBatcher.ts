/** Merges parallel `file` / `thumbnail` signed-URL needs into one POST per microtask. */

export type SignedUrlBatchKind = "file" | "thumbnail";

/** Backend default `getSignedUrl(path)` uses expiresIn 60s — stay safely under that. */
const FILE_SIGNED_URL_CACHE_MS = 50_000;
/** Backend `THUMB_SIGNED_EXPIRES_SEC` is 3600 — stay safely under that. */
const THUMBNAIL_SIGNED_URL_CACHE_MS = 50 * 60 * 1_000;

function cacheTtlMs(kind: SignedUrlBatchKind): number {
    return kind === "file" ? FILE_SIGNED_URL_CACHE_MS : THUMBNAIL_SIGNED_URL_CACHE_MS;
}

type CacheEntry = { url: string; expiresAt: number };

const urlCache = new Map<string, CacheEntry>();

function cacheStorageKey(kind: SignedUrlBatchKind, id: number, revision: string) {
    return `${kind}:${id}:${revision}`;
}

function readCache(kind: SignedUrlBatchKind, id: number, revision: string): string | null {
    const k = cacheStorageKey(kind, id, revision);
    const hit = urlCache.get(k);
    if (!hit) return null;
    if (hit.expiresAt <= Date.now()) {
        urlCache.delete(k);
        return null;
    }
    return hit.url;
}

function writeCache(kind: SignedUrlBatchKind, id: number, revision: string, url: string) {
    const k = cacheStorageKey(kind, id, revision);
    urlCache.set(k, { url, expiresAt: Date.now() + cacheTtlMs(kind) });
}

type Resolver = {
    resolve: (url: string | null) => void;
    reject: (err: unknown) => void;
    revision: string;
};

type PendingFlush = {
    fileIds: Set<number>;
    thumbIds: Set<number>;
    byKey: Map<string, Resolver[]>;
};

const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/content/batch-signed-urls`;

let microtaskScheduled = false;
let pending: PendingFlush = {
    fileIds: new Set(),
    thumbIds: new Set(),
    byKey: new Map(),
};

/** N keys for grouping waiters that share one network round-trip per (kind, id). */
function pendingKey(kind: SignedUrlBatchKind, id: number) {
    return `${kind}:${id}`;
}

function settleAll(p: PendingFlush, fn: (rs: Resolver[]) => void) {
    for (const list of p.byKey.values()) {
        fn(list);
    }
}

async function executeFlush(batch: PendingFlush): Promise<void> {
    const fileUrlForIds = [...batch.fileIds];
    const thumbnailUrlForIds = [...batch.thumbIds];
    if (fileUrlForIds.length === 0 && thumbnailUrlForIds.length === 0) {
        return;
    }

    let res: Response;
    try {
        res = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileUrlForIds, thumbnailUrlForIds }),
        });
    } catch (err) {
        settleAll(batch, (rs) => {
            for (const r of rs) r.reject(err);
        });
        return;
    }

    if (!res.ok) {
        const err = new Error(`batch-signed-urls ${res.status}`);
        settleAll(batch, (rs) => {
            for (const r of rs) r.reject(err);
        });
        return;
    }

    let data: unknown;
    try {
        data = await res.json();
    } catch (err) {
        settleAll(batch, (rs) => {
            for (const r of rs) r.reject(err);
        });
        return;
    }

    const body = data as {
        fileUrlById?: Record<string, string>;
        thumbnailUrlById?: Record<string, string>;
    };
    const fileMap = body.fileUrlById ?? {};
    const thumbMap = body.thumbnailUrlById ?? {};

    const settleKind = (kind: SignedUrlBatchKind, id: number) => {
        const pk = pendingKey(kind, id);
        const rs = batch.byKey.get(pk);
        if (!rs) return;
        const url =
            kind === "file"
                ? (fileMap[String(id)] ?? null)
                : (thumbMap[String(id)] ?? null);
        for (const r of rs) {
            r.resolve(url);
            if (url) {
                writeCache(kind, id, r.revision, url);
            }
        }
    };

    for (const id of fileUrlForIds) settleKind("file", id);
    for (const id of thumbnailUrlForIds) settleKind("thumbnail", id);
}

function scheduleFlush() {
    if (microtaskScheduled) return;
    microtaskScheduled = true;
    queueMicrotask(() => {
        microtaskScheduled = false;
        const batch = pending;
        pending = {
            fileIds: new Set(),
            thumbIds: new Set(),
            byKey: new Map(),
        };
        void executeFlush(batch);
    });
}

/**
 * Request one signed URL; may be bundled with other callers in the same microtask.
 * `revision` invalidates cache when content/thumbnail changes (not sent to the API).
 */
export function requestBatchedSignedUrl(
    contentId: number,
    kind: SignedUrlBatchKind,
    revision = "",
): Promise<string | null> {
    const hit = readCache(kind, contentId, revision);
    if (hit !== null) {
        return Promise.resolve(hit);
    }
    return new Promise((resolve, reject) => {
        if (kind === "file") {
            pending.fileIds.add(contentId);
        } else {
            pending.thumbIds.add(contentId);
        }
        const pk = pendingKey(kind, contentId);
        let list = pending.byKey.get(pk);
        if (!list) {
            list = [];
            pending.byKey.set(pk, list);
        }
        list.push({ resolve, reject, revision });
        scheduleFlush();
    });
}
