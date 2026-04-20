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

export function useInViewOnce(ref: React.RefObject<HTMLElement | null>) {
    const [visible, setVisible] = React.useState(false);
    React.useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e?.isIntersecting) {
                    setVisible(true);
                }
            },
            { rootMargin: "120px", threshold: 0.01 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [ref, visible]);
    return visible;
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

function PdfThumbFallback(_: FallbackProps) {
    return <PdfLoadError />;
}

function PdfLoadError() {
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
        </div>
    );
}

/** Renders only the first PDF page at low width (thumbnail), no interactive layers. */
function PdfFirstPageThumbnail({ url }: { url: string }) {
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const [pageWidth, setPageWidth] = React.useState(160);

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
            <ErrorBoundary FallbackComponent={PdfThumbFallback}>
                <Document
                    file={url}
                    loading={
                        <div className="mt-2 h-24 w-[85%] max-w-[200px] animate-pulse rounded-sm bg-muted-foreground/10" />
                    }
                    error={<PdfLoadError />}
                >
                    <Page
                        pageNumber={1}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-sm [&_.react-pdf__Page__canvas]:!h-auto"
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
    return <div className="size-full animate-pulse bg-muted-foreground/10" aria-hidden />;
}

function LinkPreviewImageOnly({ src }: { src: string }) {
    return (
        <img
            src={src}
            alt=""
            className="size-full object-cover object-center"
            draggable={false}
        />
    );
}

/** Thumbnail area when there is no hero image: URL / link icon only. */
function LinkPreviewUrlIcon() {
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <Link2Icon className="size-12 text-muted-foreground" aria-hidden />
        </div>
    );
}

/** Solid fill from average favicon color when Microlink has no preview image (CORS permitting). */
function LinkPreviewFaviconAverageColor({ faviconUrl }: { faviconUrl: string }) {
    const [rgb, setRgb] = React.useState<Rgb | null | undefined>(undefined);

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

    if (rgb === undefined) {
        return <LinkPreviewLoading />;
    }
    if (rgb === null) {
        return <LinkPreviewUrlIcon />;
    }
    return (
        <div
            className="size-full"
            style={{ backgroundColor: rgbToCss(rgb) }}
            aria-hidden
        />
    );
}

type ContentCardThumbnailProps = {
    entry: CardEntry;
    className?: string;
    /** When the card is near the viewport — enables lazy fetch for files / Microlink */
    visible: boolean;
    /** Microlink state for plain web links; supplied by parent together with header favicon */
    linkMicrolink?: LinkMicrolinkState;
    /** Resolved favicon URL for plain web links (Microlink logo or Google hostname icon) — used for average-color thumb when there is no preview image */
    linkTitleFaviconUrl?: string | null;
};

/**
 * Lazy-loads file previews when `visible`; plain web links use `linkMicrolink` from parent.
 */
export default function ContentCardThumbnail({
    entry,
    className,
    visible,
    linkMicrolink,
    linkTitleFaviconUrl,
}: ContentCardThumbnailProps) {
    const isFile = isSupabasePath(entry.link);
    const httpKind = !isFile && entry.link ? directHttpFileKind(entry.link) : null;

    const { url: signedUrl, loading: signedLoading, failed: signedFailed } = useSignedDownloadUrl(
        entry.item.id,
        visible && isFile && Boolean(entry.link),
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

    return (
        <div className={cn("relative size-full overflow-hidden rounded-b-xl bg-muted", className)}>
            {!visible ? (
                <LinkPreviewLoading />
            ) : isFile ? (
                !entry.link ? (
                    <GenericFilePlaceholder />
                ) : signedFailed ? (
                    <GenericFilePlaceholder />
                ) : signedLoading && !signedUrl ? (
                    <LinkPreviewLoading />
                ) : showRasterImage && previewUrl ? (
                    <img
                        src={previewUrl}
                        alt=""
                        className="size-full object-cover object-top"
                        draggable={false}
                    />
                ) : showPdfThumb && previewUrl ? (
                    <PdfFirstPageThumbnail url={previewUrl} />
                ) : showDocxThumb && previewUrl ? (
                    <DocxCardThumb url={previewUrl} />
                ) : showGenericDoc && previewUrl ? (
                    <GenericFilePlaceholder label={ext || undefined} />
                ) : signedUrl && !signedLoading ? (
                    <GenericFilePlaceholder />
                ) : (
                    <LinkPreviewLoading />
                )
            ) : !entry.link ? (
                <div className="flex size-full items-center justify-center">
                    <Link2Icon className="size-12 text-muted-foreground" aria-hidden />
                </div>
            ) : httpKind === "image" ? (
                <img
                    src={entry.link}
                    alt=""
                    className="size-full object-cover object-top"
                    loading="lazy"
                    draggable={false}
                />
            ) : httpKind === "document" ? (
                ext === "pdf" || entry.link.toLowerCase().split("?")[0].endsWith(".pdf") ? (
                    <PdfFirstPageThumbnail url={entry.link} />
                ) : ext === "docx" ? (
                    <DocxCardThumb url={entry.link} />
                ) : (
                    <GenericFilePlaceholder label={ext || undefined} />
                )
            ) : linkMicrolink && !linkMicrolink.done ? (
                <LinkPreviewLoading />
            ) : linkMicrolink?.fullImageUrl ? (
                <LinkPreviewImageOnly src={linkMicrolink.fullImageUrl} />
            ) : linkTitleFaviconUrl ? (
                <LinkPreviewFaviconAverageColor faviconUrl={linkTitleFaviconUrl} />
            ) : (
                <LinkPreviewUrlIcon />
            )}
        </div>
    );
}
