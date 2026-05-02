import { cn } from "@/lib/utils.ts";
import { TUTORIAL_REPLICA_Z } from "@/components/tutorial/tutorialDimOverlay.tsx";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type AriaAttributes,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

type Box = { left: number; top: number; width: number; height: number };

type Props = {
  active: boolean;
  /** Id on the real control (for layout sync only; clicks go to the replica). */
  targetId: string;
};

type Meta = {
  box: Box;
  href: string | null;
  label: string;
  /** Classes from the real NavLink so sizing, flex, and theme match. */
  anchorClassName: string;
  dataActive: string | null;
  ariaCurrent: string | null;
};

function readLinkMeta(targetId: string): Meta | null {
  const el = document.getElementById(targetId);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  const a = el.closest("a");
  if (!a) return null;
  const href = a.getAttribute("href")?.trim() ?? null;
  const label = (a.textContent ?? el.textContent ?? "Continue").trim() || "Continue";
  return {
    box: { left: r.left, top: r.top, width: r.width, height: r.height },
    href,
    label,
    anchorClassName: a.className,
    dataActive: a.getAttribute("data-active"),
    ariaCurrent: a.getAttribute("aria-current"),
  };
}

/**
 * Full-screen dim already blocks the real sidebar. Renders a fixed clone above the scrim so the
 * tour can steer navigation without lifting the sidebar stack.
 */
export function TutorialSidebarNavReplica({ active, targetId }: Props) {
  const navigate = useNavigate();
  const innerRef = useRef<HTMLSpanElement>(null);
  const [meta, setMeta] = useState<Meta | null>(null);

  const sync = useCallback(() => {
    if (!active || !targetId) {
      setMeta(null);
      return;
    }
    setMeta(readLinkMeta(targetId));
  }, [active, targetId]);

  useLayoutEffect(() => {
    sync();
    if (!active || !targetId) return;

    const el = document.getElementById(targetId);
    const ro = new ResizeObserver(sync);
    if (el) ro.observe(el);
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    const t = window.setInterval(sync, 250);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
      window.clearInterval(t);
    };
  }, [active, targetId, sync]);

  useLayoutEffect(() => {
    if (!active || !targetId || !meta) return;
    const span = innerRef.current;
    const el = document.getElementById(targetId);
    const a = el?.closest("a");
    if (!span || !a) return;

    span.replaceChildren();
    for (const node of a.childNodes) {
      span.appendChild(node.cloneNode(true));
    }
  }, [active, targetId, meta]);

  const go = () => {
    if (!meta?.href) return;
    const h = meta.href;
    if (/^https?:\/\//i.test(h)) {
      window.location.assign(h);
      return;
    }
    navigate(h);
  };

  if (!active || !meta) return null;

  const href = meta.href ?? "#";

  return createPortal(
    /**
     * Use the same element type as sidebar NavLinks (<a>). A native <button> applies different
     * font metrics / smoothing vs anchors in common browsers even with identical Tailwind classes.
     */
    <a
      href={href}
      className={cn(
        meta.anchorClassName,
        "pointer-events-auto cursor-pointer shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground no-underline",
        // After anchor classes so this wins over transparent/default backgrounds — portaled node
        // is not on the sidebar surface, so opacity would otherwise show the dimmer through it.
        "bg-sidebar text-sidebar-foreground",
      )}
      data-active={meta.dataActive ?? undefined}
      aria-current={
        meta.ariaCurrent as AriaAttributes["aria-current"] | undefined
      }
      style={{
        position: "fixed",
        left: meta.box.left,
        top: meta.box.top,
        width: meta.box.width,
        height: meta.box.height,
        zIndex: TUTORIAL_REPLICA_Z,
      }}
      aria-label={`Go to ${meta.label}`}
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        go();
      }}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
    >
      <span ref={innerRef} className="contents" />
    </a>,
    document.body,
  );
}
