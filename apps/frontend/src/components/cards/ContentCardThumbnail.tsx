/* eslint-disable react-refresh/only-export-components -- utilities + default component */
// Thumbnails for content cards: Discord-style link embeds (Microlink) and lightweight file previews.

import * as React from "react";
import { Document, Page } from "react-pdf";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { FileIcon, Link2Icon } from "lucide-react";
import {cn, isSupabasePath} from "@/lib/utils.ts";
import type { CardEntry } from "@/components/cards/Card.tsx";
import "@/lib/pdf-config.ts";
import DocxCardThumb from "@/components/cards/DocxCardThumb.tsx";
import {
    getAverageRgbFromFaviconUrl,
    rgbToCss,
    type Rgb,
} from "@/lib/favicon-average-color.ts";
import { useThumbnailBatch } from "@/components/cards/ThumbnailBatchContext.tsx";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

function getDisplayFileName(entry: CardEntry): string {
    const fromLink = entry.link.split("/").pop()?.split("?")[0] ?? "";
    if (fromLink.includes(".")) return decodeURIComponent(fromLink);
    if (entry.title.includes(".")) return entry.title;
    return fromLink || "document";
}

function getExt(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() ?? "";
}

const IMAGE_EXT = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "bmp",
    "tif",
    "tiff",
    "svg",
]);

/** Direct HTTP(S) links to a file path — we only render a real thumbnail for PDF (first page). */
const DIRECT_LINK_DOC_EXT = new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "csv",
    "txt",
    "htm",
    "html",
]);

function directHttpFileKind(link: string): "image" | "document" | null {
    try {
        const u = new URL(link);
        const name = u.pathname.split("/").pop() ?? "";
        if (!name.includes(".")) return null;
        const ext = getExt(name);
        if (IMAGE_EXT.has(ext)) return "image";
        if (DIRECT_LINK_DOC_EXT.has(ext)) return "document";
        return null;
    } catch {
        return null;
    }
}

function useSignedDownloadUrl(contentId: number | undefined, enabled: boolean) {
    const [url, setUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        if (contentId == null || !enabled) return;
        let cancelled = false;
        setLoading(true);
        setFailed(false);
        void fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${contentId}/download`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("download"))))
            .then((body: { url?: string }) => {
                if (!cancelled && body.url) setUrl(body.url);
                else if (!cancelled) setFailed(true);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [contentId, enabled]);

    return { url, loading, failed };
}

export type LinkMicrolinkState = {
    /** og:image or screenshot — full thumbnail area */
    fullImageUrl: string | null;
    /** Site logo / favicon from Microlink — beside title when there is no full image */
    faviconUrl: string | null;
    done: boolean;
};

/**
 * Fetches Microlink once: hero image vs logo are separate so the card can show
 * favicon by the title and a link icon in the preview area when only logo exists.
 */
export function useMicrolinkLinkPreview(pageUrl: string | undefined, enabled: boolean): LinkMicrolinkState {
    const [fullImageUrl, setFullImageUrl] = React.useState<string | null>(null);
    const [faviconUrl, setFaviconUrl] = React.useState<string | null>(null);
    const [done, setDone] = React.useState(false);

    React.useEffect(() => {
        if (!pageUrl || !enabled) return;
        let cancelled = false;
        const u = encodeURIComponent(pageUrl);
        void fetch(`https://api.microlink.io/?url=${u}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("microlink"))))
            .then(
                (json: {
                    data?: {
                        image?: { url?: string };
                        screenshot?: { url?: string };
                        logo?: { url?: string };
                    };
                }) => {
                    if (cancelled) return;
                    const d = json.data;
                    setFullImageUrl(d?.image?.url ?? d?.screenshot?.url ?? null);
                    setFaviconUrl(d?.logo?.url ?? null);
                },
            )
            .catch(() => {
                if (!cancelled) {
                    setFullImageUrl(null);
                    setFaviconUrl(null);
                }
            })
            .finally(() => {
                if (!cancelled) setDone(true);
            });
        return () => {
            cancelled = true;
        };
    }, [pageUrl, enabled]);

    return { fullImageUrl, faviconUrl, done };
}

/** True for normal website links (not uploaded files, not direct file URLs). */
export function isPlainWebPageLink(entry: CardEntry): boolean {
    if (!entry.link || isSupabasePath(entry.link)) return false;
    return directHttpFileKind(entry.link) == null;
}

/** Favicon URL for any http(s) link (used when Microlink has no logo). */
export function googleFaviconUrlForLink(href: string, size = 64): string | null {
    try {
        const host = new URL(href).hostname;
        if (!host) return null;
        return `https://www.google.com/s2/favicons?sz=${size}&domain=${encodeURIComponent(host)}`;
    } catch {
        return null;
    }
}

function PdfLoadError() {
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
        </div>
    );
}

function PdfDocumentError({ onReady }: { onReady: () => void }) {
    React.useEffect(() => {
        onReady();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- single-fire when error element mounts
    }, []);
    return <PdfLoadError />;
}

/** Renders only the first PDF page at low width (thumbnail), no interactive layers. */
function PdfFirstPageThumbnailInner({ url, onReady }: { url: string; onReady: () => void }) {
    const called = React.useRef(false);
    const safeReady = React.useCallback(() => {
        if (called.current) return;
        called.current = true;
        onReady();
    }, [onReady]);

    const safeReadyRef = React.useRef(safeReady);
    React.useEffect(() => {
        safeReadyRef.current = safeReady;
    }, [safeReady]);

    const wrapRef = React.useRef<HTMLDivElement>(null);
    const [pageWidth, setPageWidth] = React.useState(160);

    const ErrorBoundaryFallback = React.useMemo(
        () =>
            function PdfBoundaryFallback(props: FallbackProps) {
                void props;
                React.useEffect(() => {
                    safeReadyRef.current();
                }, []);
                return <PdfLoadError />;
            },
        [],
    );

    React.useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const w = el.clientWidth;
            setPageWidth(Math.min(220, Math.max(96, Math.floor(w * 0.95))));
        });
        ro.observe(el);
        setPageWidth(Math.min(220, Math.max(96, Math.floor((el.clientWidth || 160) * 0.95))));
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrapRef} className="flex size-full items-start justify-center overflow-hidden bg-muted">
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                <Document
                    file={url}
                    onLoadError={safeReady}
                    loading={
                        <div className="mt-2 h-24 w-[85%] max-w-[200px] rounded-sm bg-muted-foreground/32 motion-safe:animate-[pulse_1.15s_cubic-bezier(0.4,0,0.6,1)_infinite] dark:bg-muted-foreground/40 motion-reduce:animate-none" />
                    }
                    error={<PdfDocumentError onReady={safeReady} />}
                >
                    <Page
                        pageNumber={1}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-sm [&_.react-pdf__Page__canvas]:!h-auto"
                        onRenderSuccess={safeReady}
                        onRenderError={safeReady}
                    />
                </Document>
            </ErrorBoundary>
        </div>
    );
}

function GenericFilePlaceholder({ label }: { label?: string }) {
    return (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted px-2 text-center">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
            {label ? (
                <span className="max-w-full truncate text-[10px] font-medium uppercase text-muted-foreground">
                    {label}
                </span>
            ) : null}
        </div>
    );
}

function LinkPreviewLoading() {
    return (
        <div
            className="size-full bg-muted-foreground/32 motion-safe:animate-[pulse_1.15s_cubic-bezier(0.4,0,0.6,1)_infinite] dark:bg-muted-foreground/40 motion-reduce:animate-none motion-reduce:opacity-90"
            aria-hidden
        />
    );
}

function LinkPreviewImageOnly({
    src,
    onReady,
}: {
    src: string;
    onReady: () => void;
}) {
    const fired = React.useRef(false);
    const safe = React.useCallback(() => {
        if (fired.current) return;
        fired.current = true;
        onReady();
    }, [onReady]);
    return (
        <img
            src={src}
            alt=""
            className="size-full object-cover object-center"
            draggable={false}
            onLoad={safe}
            onError={safe}
        />
    );
}

/** Thumbnail area when there is no hero image: URL / link icon only. */
function LinkPreviewUrlIcon({ onReady }: { onReady: () => void }) {
    React.useEffect(() => {
        onReady();
    }, [onReady]);
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <Link2Icon className="size-12 text-muted-foreground" aria-hidden />
        </div>
    );
}

/** Solid fill from average favicon color when Microlink has no preview image (CORS permitting). */
function LinkPreviewFaviconAverageColor({
    faviconUrl,
    onReady,
}: {
    faviconUrl: string;
    onReady: () => void;
}) {
    const [rgb, setRgb] = React.useState<Rgb | null | undefined>(undefined);
    const fired = React.useRef(false);

    React.useEffect(() => {
        let cancelled = false;
        setRgb(undefined);
        void getAverageRgbFromFaviconUrl(faviconUrl).then((c) => {
            if (!cancelled) setRgb(c);
        });
        return () => {
            cancelled = true;
        };
    }, [faviconUrl]);

    React.useEffect(() => {
        if (rgb === undefined || rgb === null || fired.current) return;
        fired.current = true;
        onReady();
    }, [rgb, onReady]);

    if (rgb === undefined) {
        return <LinkPreviewLoading />;
    }
    if (rgb === null) {
        return <LinkPreviewUrlIcon onReady={onReady} />;
    }
    return (
        <div
            className="size-full"
            style={{ backgroundColor: rgbToCss(rgb) }}
            aria-hidden
        />
    );
}

/** Fires `onThumbReady` once when `ready` becomes true and `loadAllowed` is true. */
function ThumbReadyGate({
    contentId,
    loadAllowed,
    ready,
}: {
    contentId: number;
    loadAllowed: boolean;
    ready: boolean;
}) {
    const { onThumbReady } = useThumbnailBatch();
    const done = React.useRef(false);
    React.useEffect(() => {
        if (!loadAllowed || !ready || done.current) return;
        done.current = true;
        onThumbReady(contentId);
    }, [contentId, loadAllowed, ready, onThumbReady]);
    return null;
}

type ContentCardThumbnailProps = {
    entry: CardEntry;
    className?: string;
    /** Microlink state for plain web links; supplied by parent together with header favicon */
    linkMicrolink?: LinkMicrolinkState;
    /** Resolved favicon URL for plain web links (Microlink logo or Google hostname icon) — used for average-color thumb when there is no preview image */
    linkTitleFaviconUrl?: string | null;
};

/**
 * Loads previews when batch context allows; keeps pixels hidden until `revealThumbnails`.
 */
export default function ContentCardThumbnail({
    entry,
    className,
    linkMicrolink,
    linkTitleFaviconUrl,
}: ContentCardThumbnailProps) {
    const { loadAllowed, revealThumbnails, onThumbReady } = useThumbnailBatch();
    const contentId = entry.item.id;

    const notifyOnce = React.useCallback(() => {
        onThumbReady(contentId);
    }, [contentId, onThumbReady]);

    const isFile = isSupabasePath(entry.link);
    const httpKind = !isFile && entry.link ? directHttpFileKind(entry.link) : null;

    const { url: signedUrl, loading: signedLoading, failed: signedFailed } = useSignedDownloadUrl(
        entry.item.id,
        loadAllowed && isFile && Boolean(entry.link),
    );

    const fileName = getDisplayFileName(entry);
    const ext = getExt(fileName);

    const previewUrl = isFile ? signedUrl : httpKind ? entry.link : null;
    const showRasterImage = Boolean(previewUrl && IMAGE_EXT.has(ext));
    const showPdfThumb = Boolean(previewUrl && ext === "pdf");
    const showDocxThumb = Boolean(previewUrl && ext === "docx");
    const showGenericDoc = Boolean(
        previewUrl &&
            DIRECT_LINK_DOC_EXT.has(ext) &&
            ext !== "pdf" &&
            ext !== "docx" &&
            !IMAGE_EXT.has(ext),
    );

    let inner: React.ReactNode = null;
    let gate: React.ReactNode = null;

    if (!loadAllowed) {
        inner = <LinkPreviewLoading />;
    } else if (isFile) {
        if (!entry.link) {
            inner = <GenericFilePlaceholder />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else if (signedFailed) {
            inner = <GenericFilePlaceholder />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else if (signedLoading && !signedUrl) {
            inner = <LinkPreviewLoading />;
        } else if (showRasterImage && previewUrl) {
            inner = (
                <LinkPreviewImageOnly src={previewUrl} onReady={notifyOnce} />
            );
        } else if (showPdfThumb && previewUrl) {
            inner = <PdfFirstPageThumbnailInner url={previewUrl} onReady={notifyOnce} />;
        } else if (showDocxThumb && previewUrl) {
            inner = <DocxCardThumb url={previewUrl} onReady={notifyOnce} />;
        } else if (showGenericDoc && previewUrl) {
            inner = <GenericFilePlaceholder label={ext || undefined} />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else if (signedUrl && !signedLoading) {
            inner = <GenericFilePlaceholder />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else {
            inner = <LinkPreviewLoading />;
        }
    } else if (!entry.link) {
        inner = (
            <LinkPreviewUrlIcon
                onReady={notifyOnce}
            />
        );
    } else if (httpKind === "image") {
        inner = (
            <LinkPreviewImageOnly src={entry.link} onReady={notifyOnce} />
        );
    } else if (httpKind === "document") {
        if (ext === "pdf" || entry.link.toLowerCase().split("?")[0].endsWith(".pdf")) {
            inner = <PdfFirstPageThumbnailInner url={entry.link} onReady={notifyOnce} />;
        } else if (ext === "docx") {
            inner = <DocxCardThumb url={entry.link} onReady={notifyOnce} />;
        } else {
            inner = <GenericFilePlaceholder label={ext || undefined} />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        }
    } else if (linkMicrolink && !linkMicrolink.done) {
        inner = <LinkPreviewLoading />;
    } else if (linkMicrolink?.fullImageUrl) {
        inner = (
            <LinkPreviewImageOnly src={linkMicrolink.fullImageUrl} onReady={notifyOnce} />
        );
    } else if (linkTitleFaviconUrl) {
        inner = (
            <LinkPreviewFaviconAverageColor faviconUrl={linkTitleFaviconUrl} onReady={notifyOnce} />
        );
    } else {
        inner = <LinkPreviewUrlIcon onReady={notifyOnce} />;
    }

    return (
        <div className={cn("relative size-full overflow-hidden rounded-b-xl bg-muted", className)}>
            {!revealThumbnails ? (
                <div className="absolute inset-0 z-20">
                    <LinkPreviewLoading />
                </div>
            ) : null}
            <div
                className={cn(
                    "relative size-full",
                    !revealThumbnails && "invisible",
                )}
                aria-hidden={!revealThumbnails}
            >
                {inner}
                {gate}
            </div>
        </div>
    );
}
