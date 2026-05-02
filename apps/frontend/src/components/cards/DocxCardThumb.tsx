/**
 * Client-side DOCX thumbnail: docx-preview in a clipped, scaled layer. Each visible card
 * fetches and parses the file once — acceptable for moderate grids; server thumbs if needed later.
 */

import * as React from "react";
import { renderAsync } from "docx-preview";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { cn } from "@/lib/utils.ts";
import { FileTypeSkeleton } from "@/components/cards/FileThumbnailSkeletons.tsx";
import { DOCX_PREVIEW_RENDER_OPTIONS } from "@/lib/docx-preview-render.ts";

function DocxThumbFallback(props: FallbackProps) {
    void props;
    return (
        <div className="relative size-full overflow-hidden bg-muted">
            <FileTypeSkeleton ext="docx" />
        </div>
    );
}

function DocxThumbError() {
    return (
        <div className="relative size-full overflow-hidden bg-muted">
            <FileTypeSkeleton ext="docx" />
        </div>
    );
}

type DocxCardThumbProps = {
    url: string;
    /** Fired once when render finished or an error placeholder is shown. */
    onReady?: () => void;
};

export default function DocxCardThumb({ url, onReady }: DocxCardThumbProps) {
    const onReadyRef = React.useRef(onReady);
    React.useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);
    const readyFired = React.useRef(false);
    const clipRef = React.useRef<HTMLDivElement>(null);
    const scaleBlockRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const [scale, setScale] = React.useState(0.22);

    const fireReady = React.useCallback(() => {
        if (readyFired.current) return;
        readyFired.current = true;
        onReadyRef.current?.();
    }, []);

    React.useEffect(() => {
        readyFired.current = false;
    }, [url]);

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
                fireReady();
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
                    fireReady();
                }
            });

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
            container.innerHTML = "";
        };
    }, [url, fireReady]);

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
                    className="absolute inset-0 z-10 bg-muted-foreground/20 motion-safe:animate-[thumb-pulse_1.35s_cubic-bezier(0.4,0,0.6,1)_infinite] dark:bg-muted-foreground/26 motion-reduce:animate-none"
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
