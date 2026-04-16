/**
 * Client-side DOCX thumbnail: docx-preview in a clipped, scaled layer. Each visible card
 * fetches and parses the file once — acceptable for moderate grids; server thumbs if needed later.
 */

import * as React from "react";
import { renderAsync } from "docx-preview";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { DOCX_PREVIEW_RENDER_OPTIONS } from "@/lib/docx-preview-render.ts";

function DocxThumbFallback(_: FallbackProps) {
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
        </div>
    );
}

function DocxThumbError() {
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
        </div>
    );
}

type DocxCardThumbProps = {
    url: string;
};

export default function DocxCardThumb({ url }: DocxCardThumbProps) {
    const clipRef = React.useRef<HTMLDivElement>(null);
    const scaleBlockRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const [scale, setScale] = React.useState(0.22);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;

        setLoading(true);
        setError(false);
        container.innerHTML = "";

        const updateScale = () => {
            if (cancelled) return;
            const clip = clipRef.current;
            const block = scaleBlockRef.current;
            if (!clip || !block) return;
            const cw = clip.clientWidth;
            if (cw < 8) return;
            const iw = block.scrollWidth;
            if (iw < 8) return;
            setScale(Math.min(cw / iw, 1));
        };

        void fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Fetch failed");
                return res.blob();
            })
            .then((blob) => renderAsync(blob, container, undefined, DOCX_PREVIEW_RENDER_OPTIONS))
            .then(() => {
                if (cancelled) return;
                setLoading(false);
                requestAnimationFrame(() => {
                    updateScale();
                    const clip = clipRef.current;
                    const block = scaleBlockRef.current;
                    if (!clip || !block || cancelled) return;
                    resizeObserver = new ResizeObserver(() => updateScale());
                    resizeObserver.observe(clip);
                    resizeObserver.observe(block);
                });
            })
            .catch(() => {
                if (!cancelled) {
                    container.innerHTML = "";
                    setLoading(false);
                    setError(true);
                }
            });

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
            container.innerHTML = "";
        };
    }, [url]);

    return (
        <div
            ref={clipRef}
            className={cn(
                "pointer-events-none relative size-full overflow-hidden bg-muted",
                // docx-preview injects `background: gray` on the wrapper; match PDF card area (bg-muted).
                "[&_.docx-preview-container-wrapper]:!bg-muted",
                "[&_.docx-preview-container-wrapper]:!shadow-none [&_.docx-preview-container-wrapper>section]:!shadow-sm",
            )}
        >
            {loading ? (
                <div
                    className="absolute inset-0 z-10 animate-pulse bg-muted-foreground/10"
                    aria-hidden
                />
            ) : null}
            {error ? (
                <DocxThumbError />
            ) : (
                <ErrorBoundary FallbackComponent={DocxThumbFallback}>
                    <div
                        ref={scaleBlockRef}
                        className="absolute left-0 top-0 origin-top-left will-change-transform"
                        style={{ transform: `scale(${scale})` }}
                    >
                        <div ref={containerRef} className="min-w-0" />
                    </div>
                </ErrorBoundary>
            )}
        </div>
    );
}
