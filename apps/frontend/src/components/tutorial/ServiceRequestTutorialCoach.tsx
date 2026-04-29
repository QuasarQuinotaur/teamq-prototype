import { useServiceRequestTutorial } from "@/components/tutorial/ServiceRequestTutorialContext.tsx";
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

const PADDING = 0;
const BLOCK_Z = 45;
const HIGHLIGHT_Z = 48;
const CAPTION_Z = 100;
const EXIT_Z = 200;

const pathSrList = /^\/tutorial\/service-requests\/?$/;

const MAIN_STEP_IDS: Record<
  | "sr_main_search"
  | "sr_main_new"
  | "sr_main_presets"
  | "sr_main_filter"
  | "sr_main_sort"
  | "sr_main_list",
  string
> = {
  sr_main_search: "tutorial-sr-search",
  sr_main_new: "tutorial-sr-new-request",
  sr_main_presets: "tutorial-sr-presets",
  sr_main_filter: "tutorial-sr-filter",
  sr_main_sort: "tutorial-sr-sort",
  sr_main_list: "tutorial-sr-list-overview",
};

const MAIN_STEP_COPY: Record<keyof typeof MAIN_STEP_IDS, string> = {
  sr_main_search:
    "Search across requests by title, description, people, linked documents, id, status, and priority.",
  sr_main_new:
    "+ New Request starts a blank workflow. You’ll add stages, assignees, and due dates on the next screen.",
  sr_main_presets:
    "The chevron opens preset templates so you can start common pipelines with stages already drafted.",
  sr_main_filter:
    "Filter narrows the list by assignment, due-date presets, status, and priority—without leaving the page.",
  sr_main_sort:
    "Sort changes the order (for example by due date, priority, or title) for what you’re viewing now.",
  sr_main_list:
    "Requests appear below. “Your tasks” are ones where you’re assigned; “Other tasks” are the rest. Open a row to expand stages, check items off, or edit.",
};

function SpotlightBlockers({
  rect,
  onPointerDown,
}: {
  rect: { top: number; left: number; width: number; height: number };
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const { top, left, width, height } = rect;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = left + width;
  const b = top + height;
  const clipPath = `polygon(evenodd, 0px 0px, ${vw}px 0px, ${vw}px ${vh}px, 0px ${vh}px, 0px 0px, ${left}px ${top}px, ${r}px ${top}px, ${r}px ${b}px, ${left}px ${b}px, ${left}px ${top}px)`;
  return (
    <div
      className="pointer-events-auto fixed inset-0"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        clipPath,
        WebkitClipPath: clipPath,
        zIndex: BLOCK_Z,
      }}
      onPointerDown={onPointerDown}
      aria-hidden
    />
  );
}

function clearSrTutorialStyles() {
  for (const id of [
    "tutorial-sr-main-nav",
    "tutorial-sr-search",
    "tutorial-sr-new-request",
    "tutorial-sr-presets",
    "tutorial-sr-filter",
    "tutorial-sr-sort",
    "tutorial-sr-list-overview",
  ]) {
    const el = document.getElementById(id);
    if (el) {
      el.style.position = "";
      el.style.zIndex = "";
    }
  }
}

export function ServiceRequestTutorialCoach() {
  const tutorial = useServiceRequestTutorial();
  const location = useLocation();
  const { setOpen } = useSidebar();
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const scrollKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!tutorial?.routeIsSrTutorial) {
      scrollKeyRef.current = null;
      setRect(null);
      return;
    }

    const phase = tutorial.phase;
    const onList = pathSrList.test(location.pathname);

    const mainPhase = phase in MAIN_STEP_IDS;
    const mainStepId = mainPhase
      ? MAIN_STEP_IDS[phase as keyof typeof MAIN_STEP_IDS]
      : null;

    const sidebarSpotlight = phase === "sidebar_sr_nav";
    const targetSelector = sidebarSpotlight
      ? "#tutorial-sr-main-nav"
      : mainStepId && onList
        ? `#${mainStepId}`
        : null;

    const activeSpotlight = targetSelector != null;

    if (!activeSpotlight) {
      scrollKeyRef.current = null;
      setRect(null);
      clearSrTutorialStyles();
      return;
    }

    const measure = () => {
      const el = document.querySelector(targetSelector!) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }

      const key = `${phase}-${location.pathname}`;
      if (
        scrollKeyRef.current !== key &&
        mainPhase &&
        onList
      ) {
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
      el.style.position = "relative";
      el.style.zIndex = String(HIGHLIGHT_Z);
    };

    measure();
    const t =
      mainPhase && onList ? window.setInterval(measure, 250) : undefined;
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
      clearSrTutorialStyles();
    };
  }, [tutorial?.routeIsSrTutorial, tutorial?.phase, location.pathname]);

  useLayoutEffect(() => {
    if (!tutorial?.routeIsSrTutorial) return;
    if (
      tutorial.phase === "sidebar_sr_nav" ||
      (tutorial.phase.startsWith("sr_main_") && pathSrList.test(location.pathname))
    ) {
      setOpen(true);
    }
  }, [tutorial?.routeIsSrTutorial, tutorial?.phase, location.pathname, setOpen]);

  if (!tutorial?.routeIsSrTutorial || tutorial.phase === "inactive") {
    return null;
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
    return createPortal(
      <>
        {exitButton}
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 p-4"
          style={{ zIndex: 54 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-lg"
            role="dialog"
            aria-labelledby="sr-tutorial-intro-title"
            aria-modal="true"
          >
            <h2 id="sr-tutorial-intro-title" className="mb-2 text-lg font-semibold">
              Service requests overview
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              You’ll open this area from the sidebar, then we’ll point out the main controls on the
              list page—search, new request, filters, and sort. Nothing will be submitted. Exit
              anytime with the button above.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={tutorial.skipTutorial}>
                Skip
              </Button>
              <Button type="button" onClick={tutorial.startTutorial}>
                Start
              </Button>
            </div>
          </div>
        </div>
      </>,
      document.body,
    );
  }

  const mainPhase = tutorial.phase in MAIN_STEP_IDS;
  const onList = pathSrList.test(location.pathname);
  const mainCaption = mainPhase
    ? MAIN_STEP_COPY[tutorial.phase as keyof typeof MAIN_STEP_IDS]
    : null;
  const sidebarCaption =
    tutorial.phase === "sidebar_sr_nav"
      ? "Choose Service requests in the sidebar to open the list. The tour continues automatically on that page."
      : null;
  const caption = sidebarCaption ?? mainCaption;

  const isLastMain =
    mainPhase && tutorial.phase === "sr_main_list";

  const hasSpotlightRect =
    Boolean(rect) &&
    (tutorial.phase === "sidebar_sr_nav" ||
      (mainPhase && onList && Boolean(mainCaption)));

  if (hasSpotlightRect && rect) {
    return createPortal(
      <>
        {exitButton}
        <SpotlightBlockers rect={rect} onPointerDown={blockBackground} />
        <div
          className="fixed rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg"
          style={(() => {
            const captionWidth = Math.min(
              320,
              typeof window !== "undefined" ? window.innerWidth - 32 : 320,
            );
            const estHeight = mainPhase ? 140 : 88;
            return {
              zIndex: CAPTION_Z,
              maxWidth: captionWidth,
              top: Math.min(
                rect.top + rect.height + 12,
                typeof window !== "undefined"
                  ? window.innerHeight - estHeight - 16
                  : rect.top + rect.height + 12,
              ),
              left: Math.min(
                rect.left,
                typeof window !== "undefined"
                  ? window.innerWidth - captionWidth - 16
                  : rect.left,
              ),
            };
          })()}
          role="tooltip"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {caption ? <p className="mb-3 leading-snug">{caption}</p> : null}
          {tutorial.phase === "sidebar_sr_nav" ? null : mainPhase ? (
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() =>
                isLastMain ? tutorial.exitTutorial() : tutorial.continueSrTutorial()
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

  if (tutorial.phase === "sidebar_sr_nav") {
    return createPortal(
      <>
        {exitButton}
        <div
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: BLOCK_Z - 1 }}
        />
      </>,
      document.body,
    );
  }

  const waitingOnList =
    mainPhase && !onList && tutorial.phase.startsWith("sr_main");

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
            Open Service requests from the sidebar to see tooltips for each control.
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
        <div
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: BLOCK_Z - 1 }}
          onPointerDown={blockBackground}
        />
      </>,
      document.body,
    );
  }

  return createPortal(<>{exitButton}</>, document.body);
}
