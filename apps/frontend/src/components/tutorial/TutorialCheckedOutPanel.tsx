import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const PANEL_WIDTH = 288;
const GAP = 16;
/** Above spotlight dimmer; below exit control. */
const PANEL_Z = 75;

const DELETE_MESSAGE =
    "Here you can edit documents and delete. Delete this document to end the tutorial.";

type Props = {
    phase: "checked_out_edit" | "checked_out_delete";
    docId: number | null;
};

export function TutorialCheckedOutPanel({ phase, docId }: Props) {
    const [panelPos, setPanelPos] = useState<{ left: number; top: number } | null>(
        null,
    );

    useLayoutEffect(() => {
        if (docId == null) {
            setPanelPos(null);
            return;
        }

        const update = () => {
            const el = document.querySelector(
                `[data-document-menu-trigger="${docId}"]`,
            ) as HTMLElement | null;
            if (!el) {
                setPanelPos(null);
                return;
            }
            const r = el.getBoundingClientRect();
            const spaceRight = window.innerWidth - r.right - GAP;
            const placeRight = spaceRight >= PANEL_WIDTH;
            const left = placeRight
                ? r.right + GAP
                : Math.max(GAP, r.left - PANEL_WIDTH - GAP);
            const top = Math.max(
                GAP,
                Math.min(r.top, window.innerHeight - 220),
            );
            setPanelPos({ left, top });
        };

        update();
        const t = window.setInterval(update, 250);
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => {
            window.clearInterval(t);
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [docId]);

    if (docId == null || !panelPos) {
        return null;
    }

    const message = DELETE_MESSAGE;

    return createPortal(
        <div
            className="fixed rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
            style={{
                zIndex: PANEL_Z,
                left: panelPos.left,
                top: panelPos.top,
                width: PANEL_WIDTH,
                pointerEvents: "auto",
            }}
            role="dialog"
            aria-label="Checked out tutorial"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <p className="mb-1 text-xs font-medium text-muted-foreground">Checked out</p>
            <p className="text-sm leading-snug">{message}</p>
        </div>,
        document.body,
    );
}
