import * as React from "react";

import { cn } from "@/lib/utils.ts";

const DRAG_THRESHOLD_PX = 5;

function isMarqueeBlockedTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return Boolean(
        target.closest(
            "button, a, input, select, textarea, [role='button'], [role='menuitem'], [contenteditable='true'], [data-row-click-ignore]",
        ),
    );
}

function rectsIntersect(
    a: { left: number; top: number; right: number; bottom: number },
    b: DOMRect,
) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function collectIntersectingIds(
    root: HTMLElement,
    marquee: { left: number; top: number; right: number; bottom: number },
): number[] {
    const nodes = root.querySelectorAll<HTMLElement>("[data-marquee-entry-id]");
    const ids = new Set<number>();
    for (const el of nodes) {
        const idAttr = el.dataset.marqueeEntryId;
        if (idAttr == null || idAttr === "") continue;
        const id = Number(idAttr);
        if (!Number.isFinite(id)) continue;
        const r = el.getBoundingClientRect();
        if (rectsIntersect(marquee, r)) ids.add(id);
    }
    return [...ids];
}

function suppressNextClick() {
    const handler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener("click", handler, true);
    };
    document.addEventListener("click", handler, true);
}

type SelectMarqueeLayerProps = {
    enabled: boolean;
    /** When true, drag-select is ignored (e.g. bulk action in progress). */
    blocked?: boolean;
    children: React.ReactNode;
    className?: string;
    onCommit: (entryIds: number[]) => void;
};

/**
 * Drag a rectangle over entries marked with `data-marquee-entry-id`.
 * Parent decides how to merge (e.g. toggle each intersecting id).
 */
export default function SelectMarqueeLayer({
    enabled,
    blocked,
    children,
    className,
    onCommit,
}: SelectMarqueeLayerProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const onCommitRef = React.useRef(onCommit);
    React.useEffect(() => {
        onCommitRef.current = onCommit;
    }, [onCommit]);

    const [box, setBox] = React.useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
        null,
    );

    const dragRef = React.useRef<{
        pointerId: number;
        x0: number;
        y0: number;
        active: boolean;
    } | null>(null);

    const onPointerDownCapture = React.useCallback(
        (e: React.PointerEvent) => {
            if (!enabled || blocked) return;
            if (e.button !== 0) return;
            if (isMarqueeBlockedTarget(e.target)) return;
            if (!containerRef.current?.contains(e.target as Node)) return;

            dragRef.current = {
                pointerId: e.pointerId,
                x0: e.clientX,
                y0: e.clientY,
                active: false,
            };

            const onMove = (ev: PointerEvent) => {
                const d = dragRef.current;
                if (!d || ev.pointerId !== d.pointerId) return;
                const dx = ev.clientX - d.x0;
                const dy = ev.clientY - d.y0;
                if (
                    !d.active &&
                    dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX
                ) {
                    d.active = true;
                    document.body.style.userSelect = "none";
                    try {
                        containerRef.current?.setPointerCapture(ev.pointerId);
                    } catch {
                        /* ignore */
                    }
                    ev.preventDefault();
                }
                if (d.active) {
                    setBox({
                        x1: d.x0,
                        y1: d.y0,
                        x2: ev.clientX,
                        y2: ev.clientY,
                    });
                }
            };

            const finish = (ev: PointerEvent) => {
                const d = dragRef.current;
                if (!d || ev.pointerId !== d.pointerId) return;
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", finish);
                window.removeEventListener("pointercancel", finish);
                document.body.style.userSelect = "";
                try {
                    containerRef.current?.releasePointerCapture(ev.pointerId);
                } catch {
                    /* ignore */
                }

                if (d.active && containerRef.current) {
                    const left = Math.min(d.x0, ev.clientX);
                    const right = Math.max(d.x0, ev.clientX);
                    const top = Math.min(d.y0, ev.clientY);
                    const bottom = Math.max(d.y0, ev.clientY);
                    const ids = collectIntersectingIds(containerRef.current, {
                        left,
                        top,
                        right,
                        bottom,
                    });
                    onCommitRef.current(ids);
                    suppressNextClick();
                }

                dragRef.current = null;
                setBox(null);
            };

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", finish);
            window.addEventListener("pointercancel", finish);
        },
        [enabled, blocked],
    );

    const rectStyle = React.useMemo(() => {
        if (!box) return null;
        const left = Math.min(box.x1, box.x2);
        const top = Math.min(box.y1, box.y2);
        const width = Math.abs(box.x2 - box.x1);
        const height = Math.abs(box.y2 - box.y1);
        return { left, top, width, height };
    }, [box]);

    return (
        <div
            ref={containerRef}
            className={cn("relative min-h-0 min-w-0 flex-1 flex flex-col", className)}
            onPointerDownCapture={enabled && !blocked ? onPointerDownCapture : undefined}
        >
            {children}
            {rectStyle ? (
                <div
                    className="pointer-events-none fixed z-[200] border border-primary bg-primary/15"
                    style={{
                        left: rectStyle.left,
                        top: rectStyle.top,
                        width: rectStyle.width,
                        height: rectStyle.height,
                    }}
                    aria-hidden
                />
            ) : null}
        </div>
    );
}
