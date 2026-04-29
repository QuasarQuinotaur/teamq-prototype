import type { PointerEvent as ReactPointerEvent } from "react";

/** Below dialogs/menus (`z-50`); blocks interaction with page behind spotlight steps. */
export const TUTORIAL_DIM_Z = 45;
/** Targets sit above the dim layer so real controls paint and receive clicks. */
export const TUTORIAL_HIGHLIGHT_Z = 46;

export type TutorialHoleRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export function TutorialDimOverlay({
    onPointerDown,
    holeRect,
}: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
    /** When set, dim leaves this viewport rectangle clear so clicks reach content beneath (e.g. one nav link). */
    holeRect?: TutorialHoleRect | null;
}) {
    const dimBg = {
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: TUTORIAL_DIM_Z,
    } as const;

    if (holeRect == null) {
        return (
            <div
                className="pointer-events-auto fixed inset-0"
                style={dimBg}
                onPointerDown={onPointerDown}
                aria-hidden
            />
        );
    }

    const { top, left, width, height } = holeRect;
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    const bottomY = top + height;
    const rightX = left + width;

    return (
        <>
            {/* top */}
            <div
                className="pointer-events-auto fixed left-0 top-0"
                style={{ ...dimBg, width: vw, height: Math.max(0, top) }}
                onPointerDown={onPointerDown}
                aria-hidden
            />
            {/* bottom */}
            <div
                className="pointer-events-auto fixed left-0"
                style={{
                    ...dimBg,
                    width: vw,
                    top: bottomY,
                    height: Math.max(0, vh - bottomY),
                }}
                onPointerDown={onPointerDown}
                aria-hidden
            />
            {/* left */}
            <div
                className="pointer-events-auto fixed"
                style={{ ...dimBg, left: 0, top, width: Math.max(0, left), height }}
                onPointerDown={onPointerDown}
                aria-hidden
            />
            {/* right */}
            <div
                className="pointer-events-auto fixed"
                style={{
                    ...dimBg,
                    left: rightX,
                    top,
                    width: Math.max(0, vw - rightX),
                    height,
                }}
                onPointerDown={onPointerDown}
                aria-hidden
            />
        </>
    );
}

/**
 * Desktop sidebar uses `fixed z-10`; it sits below the portaled dim unless lifted.
 * Raises the sidebar chrome above {@link TUTORIAL_DIM_Z} for sidebar-only tutorial steps.
 */
export function setTutorialSidebarStackElevation(active: boolean) {
    const desktop = document.querySelector('[data-slot="sidebar-container"]');
    if (desktop instanceof HTMLElement) {
        desktop.style.zIndex = active ? String(TUTORIAL_HIGHLIGHT_Z) : "";
    }
}
