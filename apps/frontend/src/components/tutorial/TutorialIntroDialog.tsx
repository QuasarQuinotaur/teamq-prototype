import { Button } from "@/elements/buttons/button.tsx";
import { cn } from "@/lib/utils.ts";
import { ArrowRight } from "lucide-react";
import { type ReactNode } from "react";
import { createPortal } from "react-dom";

const MODAL_Z = 54;

/** Solid drop shadow (straight down), aligned with the intro panel treatment. */
const introPanelShadow =
  "shadow-[0_7px_0_0_color-mix(in_oklab,var(--foreground)_26%,var(--border))]";

type TutorialIntroDialogProps = {
  titleId: string;
  title: string;
  /** Short points summarizing what the walkthrough covers. */
  bullets: string[];
  dismissLabel: "Skip" | "Cancel";
  onDismiss: () => void;
  onStart: () => void;
  exitButton: ReactNode;
};

export function TutorialIntroDialog({
  titleId,
  title,
  bullets,
  dismissLabel,
  onDismiss,
  onStart,
  exitButton,
}: TutorialIntroDialogProps) {
  const listId = `${titleId}-overview`;
  return createPortal(
    <>
      {exitButton}
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
        style={{ zIndex: MODAL_Z }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground",
            introPanelShadow,
          )}
          role="dialog"
          aria-labelledby={titleId}
          aria-describedby={listId}
          aria-modal="true"
        >
          <h2
            id={titleId}
            className="mb-4 text-center text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {title}
          </h2>
          <ul
            id={listId}
            className="mb-6 list-none space-y-2.5 text-left text-sm leading-relaxed text-muted-foreground"
          >
            {bullets.map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-primary/55"
                  aria-hidden
                />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-10 min-w-[6.75rem] px-5 border-border"
              onClick={onDismiss}
            >
              {dismissLabel}
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-10 min-w-[6.75rem] px-5"
              onClick={onStart}
            >
              Start
              <ArrowRight data-icon="inline-end" className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
