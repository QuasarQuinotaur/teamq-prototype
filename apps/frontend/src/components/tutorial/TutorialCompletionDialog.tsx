import { Button } from "@/elements/buttons/button.tsx";
import { CircleCheck } from "lucide-react";
import { createPortal } from "react-dom";

const MODAL_Z = 54;

type TutorialCompletionDialogProps = {
  titleId: string;
  title: string;
  description: string;
  continueLabel?: string;
  onContinue: () => void;
};

export function TutorialCompletionDialog({
  titleId,
  title,
  description,
  continueLabel = "Back to tutorials",
  onContinue,
}: TutorialCompletionDialogProps) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
      style={{ zIndex: MODAL_Z }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mb-4 flex justify-center">
          <CircleCheck className="size-14 text-primary" aria-hidden />
        </div>
        <h2 id={titleId} className="mb-2 text-center text-lg font-semibold">
          {title}
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <Button type="button" className="w-full" onClick={onContinue}>
          {continueLabel}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
