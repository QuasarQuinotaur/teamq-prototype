import { useNotificationTutorial } from "@/components/tutorial/NotificationTutorialContext.tsx";
import { TutorialCompletionDialog } from "@/components/tutorial/TutorialCompletionDialog.tsx";
import { TutorialIntroDialog } from "@/components/tutorial/TutorialIntroDialog.tsx";
import { TutorialSidebarNavReplica } from "@/components/tutorial/TutorialSidebarNavReplica.tsx";
import {
  TutorialDimOverlay,
  TUTORIAL_HIGHLIGHT_Z,
} from "@/components/tutorial/tutorialDimOverlay.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { useSidebar } from "@/elements/sidebar-elements.tsx";
import { X } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils.ts";

const PADDING = 0;
const CAPTION_Z = 100;
const EXIT_Z = 200;

const pathNtList = /^\/tutorial\/notifications\/?$/;

const INBOX_TUTORIAL_INTRO_BULLETS = [
  "Open Inbox from the sidebar",
  "Filter by read status, sort, and refresh the list",
  "Use bulk select when you need many rows",
  "Browse notifications and open a row for detail",
];

type SpotlightBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const MAIN_STEP_IDS: Record<
  | "nt_main_status"
  | "nt_main_sort"
  | "nt_main_select"
  | "nt_main_refresh"
  | "nt_main_list",
  string
> = {
  nt_main_status: "tutorial-inbox-status-filter",
  nt_main_sort: "tutorial-inbox-sort",
  nt_main_select: "tutorial-inbox-select",
  nt_main_refresh: "tutorial-inbox-refresh",
  nt_main_list: "tutorial-inbox-list-overview",
};

const MAIN_STEP_COPY: Record<keyof typeof MAIN_STEP_IDS, string> = {
  nt_main_status:
    "All, Unread, and Read narrow what appears in your inbox without deleting anything.",
  nt_main_sort:
    "Sort changes the order—for example newest first, oldest first, or by notification type.",
  nt_main_select:
    "Select turns on bulk mode so you can tap rows or drag to marquee-select many items.",
  nt_main_refresh:
    "Refresh pulls the latest notifications from the server while you stay on this page.",
  nt_main_list:
    "Each row shows type, a short preview, and when it arrived. Open a row for full detail; use the row menu for mark read, mark unread, or delete.",
};

function setSubtreePointerEvents(root: HTMLElement, value: "" | "none"): void {
  root.style.pointerEvents = value;
  root.querySelectorAll<HTMLElement>("*").forEach((node) => {
    node.style.pointerEvents = value;
  });
}

function blockSpotlightSubtreePointerEvents(el: HTMLElement): void {
  setSubtreePointerEvents(el, "none");
}

function clearSpotlightPointerBlocks(el: HTMLElement): void {
  setSubtreePointerEvents(el, "");
}

function clearNtTutorialStyles() {
  for (const id of [
    "tutorial-inbox-main-nav",
    "tutorial-inbox-status-filter",
    "tutorial-inbox-sort",
    "tutorial-inbox-select",
    "tutorial-inbox-refresh",
    "tutorial-inbox-list-overview",
  ]) {
    const el = document.getElementById(id);
    if (el instanceof HTMLElement) {
      clearSpotlightPointerBlocks(el);
      el.style.position = "";
      el.style.zIndex = "";
    }
  }
}

export function NotificationTutorialCoach() {
  const tutorial = useNotificationTutorial();
  const location = useLocation();
  const { setOpen } = useSidebar();
  const [rect, setRect] = useState<SpotlightBounds | null>(null);
  const scrollKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!tutorial?.routeIsNotificationsTutorial) {
      scrollKeyRef.current = null;
      setRect(null);
      return;
    }

    const phase = tutorial.phase;
    if (phase === "complete") {
      scrollKeyRef.current = null;
      setRect(null);
      clearNtTutorialStyles();
      return;
    }
    const onList = pathNtList.test(location.pathname);

    const mainPhase = phase in MAIN_STEP_IDS;
    const mainStepId = mainPhase
      ? MAIN_STEP_IDS[phase as keyof typeof MAIN_STEP_IDS]
      : null;

    const sidebarSpotlight = phase === "sidebar_inbox_nav";
    const targetSelector = sidebarSpotlight
      ? "#tutorial-inbox-main-nav"
      : mainStepId && onList
        ? `#${mainStepId}`
        : null;

    const activeSpotlight = targetSelector != null;

    if (!activeSpotlight) {
      scrollKeyRef.current = null;
      setRect(null);
      clearNtTutorialStyles();
      return;
    }

    const measure = () => {
      const el = document.querySelector(targetSelector!) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }

      const key = `${phase}-${location.pathname}`;
      if (scrollKeyRef.current !== key && mainPhase && onList) {
        el.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "nearest",
        });
        scrollKeyRef.current = key;
      } else if (scrollKeyRef.current !== key && sidebarSpotlight) {
        el.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "nearest",
        });
        scrollKeyRef.current = key;
      }

      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
      if (mainPhase && onList) {
        el.style.position = "relative";
        el.style.zIndex = String(TUTORIAL_HIGHLIGHT_Z);
        blockSpotlightSubtreePointerEvents(el);
      } else if (sidebarSpotlight) {
        clearSpotlightPointerBlocks(el);
      }
    };

    measure();
    const t =
      (mainPhase && onList) || sidebarSpotlight
        ? window.setInterval(measure, 250)
        : undefined;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const observed = document.querySelector(targetSelector) as HTMLElement | null;
    const ro = new ResizeObserver(measure);
    if (observed) ro.observe(observed);

    return () => {
      if (t != null) window.clearInterval(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      ro.disconnect();
      clearNtTutorialStyles();
    };
  }, [tutorial?.routeIsNotificationsTutorial, tutorial?.phase, location.pathname]);

  useLayoutEffect(() => {
    if (!tutorial?.routeIsNotificationsTutorial) return;
    if (tutorial.phase === "complete") return;
    if (
      tutorial.phase === "sidebar_inbox_nav" ||
      (tutorial.phase.startsWith("nt_main_") && pathNtList.test(location.pathname))
    ) {
      setOpen(true);
    }
  }, [
    tutorial?.routeIsNotificationsTutorial,
    tutorial?.phase,
    location.pathname,
    setOpen,
  ]);

  if (!tutorial?.routeIsNotificationsTutorial || tutorial.phase === "inactive") {
    return null;
  }

  if (tutorial.phase === "complete") {
    return (
      <TutorialCompletionDialog
        titleId="nt-tutorial-complete-title"
        title="Tutorial complete"
        description="You’ve finished the inbox overview. You can run it again anytime from Tutorials."
        onContinue={tutorial.acknowledgeNotificationTutorialComplete}
      />
    );
  }

  const blockBackground = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const exit = tutorial.exitTutorial;

  const exitButton = (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="fixed top-4 right-4 rounded-full shadow-md"
      style={{ zIndex: EXIT_Z }}
      onClick={exit}
      aria-label="Exit tutorial"
    >
      <X className="size-5" />
    </Button>
  );

  if (tutorial.phase === "intro") {
    return (
      <TutorialIntroDialog
        titleId="nt-tutorial-intro-title"
        title="Inbox Tutorial"
        bullets={INBOX_TUTORIAL_INTRO_BULLETS}
        dismissLabel="Cancel"
        onDismiss={tutorial.skipTutorial}
        onStart={tutorial.startTutorial}
        exitButton={exitButton}
      />
    );
  }

  const mainPhase = tutorial.phase in MAIN_STEP_IDS;
  const onList = pathNtList.test(location.pathname);
  const mainCaption = mainPhase
    ? MAIN_STEP_COPY[tutorial.phase as keyof typeof MAIN_STEP_IDS]
    : null;
  const sidebarCaption =
    tutorial.phase === "sidebar_inbox_nav"
      ? "Choose Inbox in the sidebar (bottom). The tour continues automatically on the notifications page."
      : null;
  const caption = sidebarCaption ?? mainCaption;

  const isLastMain = mainPhase && tutorial.phase === "nt_main_list";

  const mainListSpotlight = mainPhase && onList && Boolean(mainCaption);
  const hasSpotlightCaption =
    Boolean(rect) &&
    (tutorial.phase === "sidebar_inbox_nav" || mainListSpotlight);

  if (hasSpotlightCaption && rect) {
    return createPortal(
      <>
        {exitButton}
        <TutorialDimOverlay onPointerDown={blockBackground} />
        <TutorialSidebarNavReplica
          active={tutorial.phase === "sidebar_inbox_nav" && Boolean(rect)}
          targetId="tutorial-inbox-main-nav"
        />
        <div
          className={cn(
            "fixed rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg",
            tutorial.phase === "sidebar_inbox_nav" && "pointer-events-none",
          )}
          style={(() => {
            const captionWidth = Math.min(
              320,
              typeof window !== "undefined" ? window.innerWidth - 32 : 320,
            );
            const estHeight = mainPhase ? 140 : 88;
            const vw =
              typeof window !== "undefined" ? window.innerWidth : 1200;
            const vh =
              typeof window !== "undefined" ? window.innerHeight : 800;

            if (tutorial.phase === "sidebar_inbox_nav") {
              const gap = 12;
              const minMargin = 16;
              /** Sidebar step has no Next button; allow wrapped copy height. */
              const sidebarCaptionEstH = 132;
              const rectRight = rect.left + rect.width;
              const spaceRight = vw - rectRight - gap - minMargin;
              const fitsBeside = spaceRight >= 176;

              if (fitsBeside) {
                const maxWidth = Math.min(320, spaceRight);
                const left = rectRight + gap;
                let top =
                  rect.top + rect.height / 2 - sidebarCaptionEstH / 2;
                top = Math.max(
                  minMargin,
                  Math.min(top, vh - sidebarCaptionEstH - minMargin),
                );
                return {
                  zIndex: CAPTION_Z,
                  maxWidth,
                  top,
                  left,
                };
              }

              // Too narrow to sit beside — park above the inbox so the footer button stays uncovered.
              const maxWidth = Math.min(320, vw - 2 * minMargin);
              const left = Math.max(
                minMargin,
                Math.min(rect.left, vw - maxWidth - minMargin),
              );
              let top = rect.top - sidebarCaptionEstH - gap;
              top = Math.max(
                minMargin,
                Math.min(top, vh - sidebarCaptionEstH - minMargin),
              );
              return {
                zIndex: CAPTION_Z,
                maxWidth,
                top,
                left,
              };
            }

            return {
              zIndex: CAPTION_Z,
              maxWidth: captionWidth,
              top: Math.min(
                rect.top + rect.height + 12,
                vh - estHeight - 16,
              ),
              left: Math.min(rect.left, vw - captionWidth - 16),
            };
          })()}
          role="tooltip"
          onPointerDown={(e) => {
            if (tutorial.phase === "sidebar_inbox_nav") return;
            e.stopPropagation();
          }}
        >
          {caption ? <p className="mb-3 leading-snug">{caption}</p> : null}
          {tutorial.phase === "sidebar_inbox_nav" ? null : mainPhase ? (
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() =>
                isLastMain ? tutorial.completeTutorial() : tutorial.continueNotificationTutorial()
              }
            >
              {isLastMain ? "Done" : "Next"}
            </Button>
          ) : null}
        </div>
      </>,
      document.body,
    );
  }

  const waitingOnList =
    mainPhase && !onList && tutorial.phase.startsWith("nt_main");

  if (waitingOnList) {
    return createPortal(
      <>
        {exitButton}
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onPointerDown={blockBackground}
        />
        <div
          className="fixed z-[60] mx-auto max-w-sm rounded-xl border border-border bg-popover px-4 py-3 text-center text-sm text-popover-foreground shadow-lg"
          style={{
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          role="status"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="leading-snug">
            Open Inbox from the sidebar to see tooltips for each control.
          </p>
        </div>
      </>,
      document.body,
    );
  }

  const needDimOnly = mainPhase && onList && !rect;

  if (needDimOnly) {
    return createPortal(
      <>
        {exitButton}
        <TutorialDimOverlay onPointerDown={blockBackground} />
      </>,
      document.body,
    );
  }

  return createPortal(<>{exitButton}</>, document.body);
}
