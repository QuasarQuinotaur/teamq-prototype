import type { PointerEvent as ReactPointerEvent } from "react";

/** Below dialogs/menus (`z-50`); blocks interaction with page behind spotlight steps. */
export const TUTORIAL_DIM_Z = 45;
/** Targets sit above the dim layer so real controls paint and receive clicks. */
export const TUTORIAL_HIGHLIGHT_Z = 46;

export function TutorialDimOverlay({
    onPointerDown,
}: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
    return (
        <div
            className="pointer-events-auto fixed inset-0"
            style={{
                backgroundColor: "rgba(0,0,0,0.55)",
                zIndex: TUTORIAL_DIM_Z,
            }}
            onPointerDown={onPointerDown}
            aria-hidden
        />
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
