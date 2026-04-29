/* eslint-disable react-refresh/only-export-components -- utilities + default component */
// Thumbnails for content cards: Discord-style link embeds (Microlink) and lightweight file previews.

import * as React from "react";
import { Document, Page } from "react-pdf";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { FileIcon } from "lucide-react";
import {cn, isSupabasePath} from "@/lib/utils.ts";
import type { CardEntry } from "@/components/cards/Card.tsx";
import "@/lib/pdf-config.ts";
import DocxCardThumb from "@/components/cards/DocxCardThumb.tsx";
import ExcelCardThumb from "@/components/cards/ExcelCardThumb.tsx";
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
        void fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${contentId}/file-url`, {
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

function GenericFilePlaceholder({ ext }: { ext?: string }) {
    return (
        <div className="flex size-full flex-col items-center justify-center gap-1 px-2 text-center bg-muted">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
            {ext ? (
                <span className="max-w-full truncate text-[10px] font-medium uppercase text-muted-foreground">
                    {ext}
                </span>
            ) : null}
        </div>
    );
}

/** Spreadsheet skeleton — used for xlsx/xls and csv. */
function ExcelSkeleton() {
    return (
        <div className="relative size-full overflow-hidden bg-white">
            <div
                className="absolute inset-[6px] flex flex-col overflow-hidden rounded-[2px]"
                style={{ gap: 1, backgroundColor: "#e4e4e4" }}
            >
                {/* Header row */}
                <div className="flex shrink-0 h-[14%]" style={{ gap: 1 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: "#d0d0d0" }} />
                    ))}
                </div>
                {/* Data rows */}
                {[0, 1, 2, 3, 4].map((r) => (
                    <div key={r} className="flex flex-1" style={{ gap: 1 }}>
                        {[0, 1, 2, 3].map((c) => (
                            <div
                                key={c}
                                className="flex-1"
                                style={{ backgroundColor: r % 2 === 0 ? "#ffffff" : "#f3f3f3" }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Slide skeleton — used for pptx/ppt. */
function PowerPointSkeleton() {
    return (
        <div className="relative size-full flex items-center justify-center overflow-hidden bg-white">
            {/* Main slide */}
            <div
                className="w-[78%] h-[66%] flex flex-col rounded-[2px] overflow-hidden"
                style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 6px rgba(0,0,0,0.15)" }}
            >
                {/* Title band */}
                <div
                    className="shrink-0 h-[28%] flex flex-col justify-center px-[8%] gap-[10%]"
                    style={{ backgroundColor: "#f0f0f0" }}
                >
                    <div className="h-[28%] w-[62%] rounded-[1px]" style={{ backgroundColor: "#c8c8c8" }} />
                    <div className="h-[18%] w-[38%] rounded-[1px]" style={{ backgroundColor: "#dcdcdc" }} />
                </div>
                {/* Bullet lines */}
                <div className="flex-1 flex flex-col px-[8%] py-[6%] gap-[10%]">
                    {[78, 62, 70].map((w, i) => (
                        <div
                            key={i}
                            className="h-[15%] rounded-[1px]"
                            style={{ backgroundColor: "#e4e4e4", width: `${w}%` }}
                        />
                    ))}
                </div>
            </div>
            {/* Mini slide strip */}
            <div className="absolute top-[6px] right-[6px] flex flex-col gap-[3px]">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-[20px] h-[14px] rounded-[1px]"
                        style={{ backgroundColor: i === 0 ? "#e0e0e0" : "#ececec" }}
                    />
                ))}
            </div>
        </div>
    );
}

/** Document page skeleton — used for doc and as the default fallback. */
function WordDocSkeleton() {
    return (
        <div className="relative size-full flex justify-center overflow-hidden" style={{ backgroundColor: "#f0f0f0" }}>
            <div
                className="mt-[8px] w-[72%] flex flex-col px-[10%] py-[6%] gap-[5%] rounded-t-[2px]"
                style={{
                    backgroundColor: "#ffffff",
                    minHeight: "90%",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
                }}
            >
                {/* Title */}
                <div
                    className="h-[5%] min-h-[4px] w-[55%] rounded-[1px] mb-[2%]"
                    style={{ backgroundColor: "#c0c0c0" }}
                />
                {/* Text lines */}
                {[95, 88, 92, 80, 90, 85, 78, 92, 70].map((w, i) => (
                    <div
                        key={i}
                        className="h-[4%] min-h-[3px] rounded-[1px]"
                        style={{ backgroundColor: "#dedede", width: `${w}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

/** Plain-text skeleton — reuses the doc page layout. */
function TextSkeleton() {
    return <WordDocSkeleton />;
}

/** Browser-chrome + page layout skeleton — used for html/htm. */
function HtmlSkeleton() {
    return (
        <div className="relative size-full flex flex-col overflow-hidden bg-white">
            {/* Browser chrome bar */}
            <div
                className="shrink-0 h-[15%] flex items-center px-[6%]"
                style={{ backgroundColor: "#ebebeb", gap: "4%" }}
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-full"
                        style={{ backgroundColor: "#cccccc", width: 7, height: 7, flexShrink: 0 }}
                    />
                ))}
                <div
                    className="flex-1 h-[38%] rounded-[2px] ml-[2%]"
                    style={{ backgroundColor: "#ffffff" }}
                />
            </div>
            {/* Page content */}
            <div className="flex-1 flex flex-col overflow-hidden px-[8%] py-[5%]" style={{ gap: "6%" }}>
                {/* Hero banner */}
                <div className="shrink-0 h-[28%] w-full rounded-[2px]" style={{ backgroundColor: "#e8e8e8" }} />
                {/* Text lines */}
                {[68, 88, 58].map((w, i) => (
                    <div
                        key={i}
                        className="shrink-0 rounded-[1px]"
                        style={{ backgroundColor: "#d8d8d8", height: "9%", minHeight: 3, width: `${w}%` }}
                    />
                ))}
                {/* Two-column blocks */}
                <div className="flex flex-1 overflow-hidden" style={{ gap: "6%" }}>
                    <div className="flex-1 rounded-[2px]" style={{ backgroundColor: "#eeeeee" }} />
                    <div className="flex-1 rounded-[2px]" style={{ backgroundColor: "#eeeeee" }} />
                </div>
            </div>
        </div>
    );
}

/** Picks the best skeleton for a known file extension; falls back to a generic icon. */
function FileTypeSkeleton({ ext }: { ext?: string }) {
    switch (ext) {
        case "xlsx":
        case "xls":
        case "csv":
            return <ExcelSkeleton />;
        case "pptx":
        case "ppt":
            return <PowerPointSkeleton />;
        case "doc":
            return <WordDocSkeleton />;
        case "txt":
            return <TextSkeleton />;
        case "html":
        case "htm":
            return <HtmlSkeleton />;
        default:
            return <WordDocSkeleton />;
    }
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

/** Browser-chrome skeleton shown when Microlink has no preview image. */
function WebPageSkeleton({
    faviconUrl,
    onReady,
}: {
    faviconUrl?: string | null;
    onReady: () => void;
}) {
    React.useEffect(() => {
        onReady();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- single-fire on mount
    }, []);

    return (
        <div className="relative size-full flex flex-col overflow-hidden bg-white">
            {/* Browser chrome */}
            <div
                className="shrink-0 h-[14%] flex items-center px-[5%]"
                style={{ backgroundColor: "#f0f0f0", gap: "3%" }}
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-full shrink-0"
                        style={{ backgroundColor: "#d0d0d0", width: 6, height: 6 }}
                    />
                ))}
                {/* URL bar */}
                <div
                    className="flex-1 h-[42%] rounded-[3px] flex items-center px-[6%]"
                    style={{ backgroundColor: "#ffffff", gap: "5%" }}
                >
                    {/* {faviconUrl ? (
                        <img
                            src={faviconUrl}
                            alt=""
                            className="shrink-0 object-contain"
                            style={{ width: 8, height: 8 }}
                            draggable={false}
                        />
                    ) : (
                        <div className="shrink-0 rounded-full" style={{ width: 8, height: 8, backgroundColor: "#e0e0e0" }} />
                    )} */}
                    <div className="flex-1 h-[35%] rounded-[1px]" style={{ backgroundColor: "#e8e8e8" }} />
                </div>
            </div>
            {/* Page body — plain white */}
            <div className="flex-1" style={{ backgroundColor: "#fafafa"}}/>
        </div>
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
    const showExcelThumb = Boolean(previewUrl && (ext === "xlsx" || ext === "xls" || ext === "csv"));
    const showGenericDoc = Boolean(
        previewUrl &&
            DIRECT_LINK_DOC_EXT.has(ext) &&
            ext !== "pdf" &&
            ext !== "docx" &&
            ext !== "xlsx" &&
            ext !== "xls" &&
            ext !== "csv" &&
            !IMAGE_EXT.has(ext),
    );

    let inner: React.ReactNode = null;
    let gate: React.ReactNode = null;

    if (!loadAllowed) {
        inner = <LinkPreviewLoading />;
    } else if (isFile) {
        if (!entry.link) {
            inner = <FileTypeSkeleton ext={ext || undefined} />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else if (signedFailed) {
            inner = <FileTypeSkeleton ext={ext || undefined} />;
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
        } else if (showExcelThumb && previewUrl) {
            inner = <ExcelCardThumb url={previewUrl} onReady={notifyOnce} />;
        } else if (showGenericDoc && previewUrl) {
            inner = <FileTypeSkeleton ext={ext || undefined} />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else if (signedUrl && !signedLoading) {
            inner = <FileTypeSkeleton ext={ext || undefined} />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        } else {
            inner = <LinkPreviewLoading />;
        }
    } else if (!entry.link) {
        inner = <WebPageSkeleton onReady={notifyOnce} />;
    } else if (httpKind === "image") {
        inner = (
            <LinkPreviewImageOnly src={entry.link} onReady={notifyOnce} />
        );
    } else if (httpKind === "document") {
        if (ext === "pdf" || entry.link.toLowerCase().split("?")[0].endsWith(".pdf")) {
            inner = <PdfFirstPageThumbnailInner url={entry.link} onReady={notifyOnce} />;
        } else if (ext === "docx") {
            inner = <DocxCardThumb url={entry.link} onReady={notifyOnce} />;
        } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
            inner = <ExcelCardThumb url={entry.link} onReady={notifyOnce} />;
        } else {
            inner = <FileTypeSkeleton ext={ext || undefined} />;
            gate = <ThumbReadyGate contentId={contentId} loadAllowed={loadAllowed} ready />;
        }
    } else if (linkMicrolink && !linkMicrolink.done) {
        inner = <LinkPreviewLoading />;
    } else if (linkMicrolink?.fullImageUrl) {
        inner = (
            <LinkPreviewImageOnly src={linkMicrolink.fullImageUrl} onReady={notifyOnce} />
        );
    } else {
        inner = <WebPageSkeleton faviconUrl={linkTitleFaviconUrl} onReady={notifyOnce} />;
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
