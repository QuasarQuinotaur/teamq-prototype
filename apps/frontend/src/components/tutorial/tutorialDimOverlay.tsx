import type { PointerEvent as ReactPointerEvent } from "react";

/** Full-screen scrim; blocks hits on the page behind tutorial steps. */
export const TUTORIAL_DIM_Z = 45;
/** Spotlight target sits above the scrim so it stays interactive and undimmed. Must exceed {@link TUTORIAL_DIM_Z}. */
export const TUTORIAL_HIGHLIGHT_Z = 46;
/** Sidebar nav replica sits above the dimmer, below coach captions ({@link TUTORIAL_DIM_Z} < this < caption z-index). */
export const TUTORIAL_REPLICA_Z = 55;

export function TutorialDimOverlay({
  onPointerDown,
}: {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
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
