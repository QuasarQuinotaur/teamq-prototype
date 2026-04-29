import { Button } from "@/elements/buttons/button.tsx";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const PANEL_WIDTH = 288;
const GAP = 16;
const PANEL_Z = 70;
/** Approximate height for viewport clamp (padding + steps + footer). */
const APPROX_PANEL_HEIGHT = 260;

const TUTORIAL_DOCUMENT_STEPS: { anchorId: string; message: string }[] = [
    {
        anchorId: "document-add-form-name",
        message:
            "This is the title shown in your document lists. It’s already filled in so you can focus on the next steps.",
    },
    {
        anchorId: "document-add-form-content-type",
        message:
            "Pick a category—workflow, reference, or tool. Workflow is already selected here.",
    },
    {
        anchorId: "document-add-form-source",
        message:
            "Attach a file or paste a link. A sample link is filled in so you can continue without uploading.",
    },
    {
        anchorId: "document-add-form-job-positions",
        message:
            "Choose which job roles can open this document. Your role is already selected.",
    },
    {
        anchorId: "document-add-form-expiration",
        message:
            "Pick when the document should be reviewed. A date one year from today is filled in.",
    },
    {
        anchorId: "tutorial-9",
        message:
            "Click Save. Next you’ll open My content, check out this document, then edit or delete it from the Checked out page.",
    },
];

export function TutorialDocumentStepPanel({ active }: { active: boolean }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [panelPos, setPanelPos] = useState<{
        left: number;
        top: number;
    } | null>(null);

    useLayoutEffect(() => {
        if (!active) {
            setStepIndex(0);
        }
    }, [active]);

    useLayoutEffect(() => {
        if (!active) return;

        const updatePanel = () => {
            const dialog = document.querySelector(
                '[data-slot="dialog-content"]',
            ) as HTMLElement | null;
            if (!dialog) {
                setPanelPos(null);
                return;
            }
            const r = dialog.getBoundingClientRect();
            const spaceRight = window.innerWidth - r.right - GAP;
            const placeRight = spaceRight >= PANEL_WIDTH;
            const left = placeRight
                ? r.right + GAP
                : Math.max(GAP, r.left - PANEL_WIDTH - GAP);

            const { anchorId } = TUTORIAL_DOCUMENT_STEPS[stepIndex];
            const anchorEl = document.getElementById(anchorId);
            const ar = anchorEl?.getBoundingClientRect();

            let panelTop: number;
            if (ar) {
                panelTop =
                    ar.top +
                    ar.height / 2 -
                    APPROX_PANEL_HEIGHT / 2;
                panelTop = Math.max(
                    GAP,
                    Math.min(
                        panelTop,
                        window.innerHeight - APPROX_PANEL_HEIGHT - GAP,
                    ),
                );
            } else {
                panelTop = Math.max(
                    GAP,
                    Math.min(r.top, window.innerHeight - APPROX_PANEL_HEIGHT),
                );
            }

            setPanelPos({ left, top: panelTop });
        };

        const scrollAnchorAndPosition = () => {
            const { anchorId } = TUTORIAL_DOCUMENT_STEPS[stepIndex];
            document
                .getElementById(anchorId)
                ?.scrollIntoView({ block: "nearest", behavior: "auto" });
            updatePanel();
        };

        scrollAnchorAndPosition();

        const t = window.setInterval(updatePanel, 250);
        window.addEventListener("resize", updatePanel);
        window.addEventListener("scroll", updatePanel, true);

        const dialog = document.querySelector(
            '[data-slot="dialog-content"]',
        ) as HTMLElement | null;
        dialog?.addEventListener("scroll", updatePanel);

        return () => {
            window.clearInterval(t);
            window.removeEventListener("resize", updatePanel);
            window.removeEventListener("scroll", updatePanel, true);
            dialog?.removeEventListener("scroll", updatePanel);
        };
    }, [active, stepIndex]);

    if (!active || !panelPos) {
        return null;
    }

    const step = TUTORIAL_DOCUMENT_STEPS[stepIndex];
    const last = stepIndex === TUTORIAL_DOCUMENT_STEPS.length - 1;
    const first = stepIndex === 0;

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
            aria-label="Tutorial hints"
        >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
                Step {stepIndex + 1} of {TUTORIAL_DOCUMENT_STEPS.length}
            </p>
            <p className="mb-4 text-sm leading-snug">{step.message}</p>
            <div className="flex items-center justify-between gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={first}
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                    Previous
                </Button>
                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={last}
                    onClick={() =>
                        setStepIndex((i) =>
                            Math.min(TUTORIAL_DOCUMENT_STEPS.length - 1, i + 1),
                        )
                    }
                >
                    Next
                </Button>
            </div>
        </div>,
        document.body,
    );
}
