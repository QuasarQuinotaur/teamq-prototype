import { useTutorial } from "@/components/tutorial/TutorialContext.tsx";
import { TutorialCheckedOutPanel } from "@/components/tutorial/TutorialCheckedOutPanel.tsx";
import { TutorialCompletionDialog } from "@/components/tutorial/TutorialCompletionDialog.tsx";
import { TutorialIntroDialog } from "@/components/tutorial/TutorialIntroDialog.tsx";
import { TutorialSidebarNavReplica } from "@/components/tutorial/TutorialSidebarNavReplica.tsx";
import {
    TutorialDimOverlay,
    TUTORIAL_HIGHLIGHT_Z,
} from "@/components/tutorial/tutorialDimOverlay.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { useSidebar } from "@/elements/sidebar-elements.tsx";
import { X, Loader2 } from "lucide-react";
import {
    useLayoutEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

/** Caption placement uses measured bounds from the spotlight target. */
const PADDING = 0;
/** Coach caption above highlighted targets and dim. */
const CAPTION_Z = 100;
const EXIT_Z = 200;

const pathTutorialMyDocuments = /\/tutorial\/my-documents\/?$/;
const pathTutorialCheckedOut = /\/tutorial\/checked-out\/?$/;

const DOCUMENT_TUTORIAL_INTRO_BULLETS = [
    "Create and save a document with New Document",
    "Find it on My content and check it out",
    "Open it from Checked out to edit",
    "Delete it to finish the walkthrough",
];

/** Padding when scrolling a tutorial row inside nested `overflow-auto` regions (e.g. document list). */
const TUTORIAL_ROW_SCROLL_PADDING = 16;

/** After smooth `scrollIntoView`, pause before spotlight measure (nested scrollers lack one reliable completion event everywhere). */
const TUTORIAL_SMOOTH_SCROLL_SETTLE_MS = 460;

function isVerticallyFullyVisibleInScrollParents(
    el: HTMLElement,
    padding: number,
): boolean {
    let node: HTMLElement | null = el;
    while (node && node !== document.body) {
        const parent = node.parentElement;
        if (!parent) {
            break;
        }
        const st = window.getComputedStyle(parent);
        const canScrollY =
            (st.overflowY === "auto" ||
                st.overflowY === "scroll" ||
                st.overflow === "auto" ||
                st.overflow === "scroll") &&
            parent.scrollHeight > parent.clientHeight + 1;
        if (canScrollY) {
            const er = el.getBoundingClientRect();
            const pr = parent.getBoundingClientRect();
            if (
                er.top < pr.top + padding - 0.5 ||
                er.bottom > pr.bottom - padding + 0.5
            ) {
                return false;
            }
        }
        node = parent;
    }
    const er = el.getBoundingClientRect();
    if (er.top < padding || er.bottom > window.innerHeight - padding) {
        return false;
    }
    return true;
}

/**
 * Ensures the element is not clipped vertically by any scrollable ancestor or the window.
 * Repeated calls are cheap when already visible; the tutorial measure interval uses this after layout.
 */
function scrollTutorialRowFullyIntoView(el: HTMLElement, padding: number) {
    for (let i = 0; i < 16; i++) {
        if (isVerticallyFullyVisibleInScrollParents(el, padding)) {
            return;
        }

        let adjusted = false;
        let node: HTMLElement | null = el;
        while (node && node !== document.body) {
            const parent = node.parentElement;
            if (!parent) {
                break;
            }
            const st = window.getComputedStyle(parent);
            const canScrollY =
                (st.overflowY === "auto" ||
                    st.overflowY === "scroll" ||
                    st.overflow === "auto" ||
                    st.overflow === "scroll") &&
                parent.scrollHeight > parent.clientHeight + 1;
            if (canScrollY) {
                const er = el.getBoundingClientRect();
                const pr = parent.getBoundingClientRect();
                if (er.top < pr.top + padding) {
                    parent.scrollTop -= pr.top + padding - er.top;
                    adjusted = true;
                    break;
                }
                if (er.bottom > pr.bottom - padding) {
                    parent.scrollTop += er.bottom - (pr.bottom - padding);
                    adjusted = true;
                    break;
                }
            }
            node = parent;
        }

        if (!adjusted) {
            const er = el.getBoundingClientRect();
            if (er.top < padding) {
                window.scrollBy({ top: er.top - padding, behavior: "auto" });
                adjusted = true;
            } else if (er.bottom > window.innerHeight - padding) {
                window.scrollBy({
                    top: er.bottom - window.innerHeight + padding,
                    behavior: "auto",
                });
                adjusted = true;
            }
        }

        if (!adjusted) {
            break;
        }
    }
}

/**
 * Spotlight + scroll anchor: prefer the flagged list row / grid card so the whole document tile is
 * brought into view, not only the ⋯ trigger.
 */
function resolveTutorialDocumentSpotlightEl(
    docId: number | null,
): HTMLElement | null {
    if (docId == null) return null;
    const card = document.querySelector<HTMLElement>(
        "[data-tutorial-doc-card]",
    );
    if (card) return card;
    const menu = document.querySelector<HTMLElement>(
        `[data-document-menu-trigger="${docId}"]`,
    );
    const tr = menu?.closest("tr");
    if (tr instanceof HTMLElement) return tr;
    return menu;
}

/** Approx height for captions anchored with `top` to spotlight rects. */
const EST_CAPTION_DEFAULT = 88;

function clearSidebarTutorialStyles() {
    for (const id of [
        "tutorial-1",
        "tutorial-2",
        "tutorial-my-content-nav",
        "tutorial-checked-out-nav",
    ]) {
        const el = document.getElementById(id);
        if (el) {
            el.style.position = "";
            el.style.zIndex = "";
        }
    }
}

function clearTutorialDocRowStyles(docId: number | null) {
    document.querySelectorAll("[data-tutorial-doc-card]").forEach((node) => {
        if (node instanceof HTMLElement) {
            node.style.position = "";
            node.style.zIndex = "";
        }
    });
    if (docId != null) {
        const menu = document.querySelector(`[data-document-menu-trigger="${docId}"]`);
        if (menu instanceof HTMLElement) {
            menu.style.position = "";
            menu.style.zIndex = "";
        }
    }
}

type SpotlightBounds = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export function TutorialCoach() {
    const tutorial = useTutorial();
    const location = useLocation();
    const { setOpen } = useSidebar();
    const [rect, setRect] = useState<SpotlightBounds | null>(null);
    const docSpotlightSmoothPendingRef = useRef(false);
    const docSpotlightSmoothTimerRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        if (!tutorial?.routeIsTutorial) {
            setRect(null);
            return;
        }

        const phase = tutorial.phase;
        const docId = tutorial.tutorialDocId;

        if (phase === "complete") {
            setRect(null);
            clearSidebarTutorialStyles();
            clearTutorialDocRowStyles(docId);
            return;
        }

        const onMyDocuments = pathTutorialMyDocuments.test(location.pathname);
        const onCheckedOut = pathTutorialCheckedOut.test(location.pathname);

        const myDocumentsRowSpotlight =
            onMyDocuments &&
            docId != null &&
            phase === "my_content_checkout";

        const checkedOutRowSpotlight =
            onCheckedOut &&
            docId != null &&
            (phase === "checked_out_edit" || phase === "checked_out_delete");

        const activeSpotlight =
            phase === "sidebar_highlight" ||
            phase === "new_doc_highlight" ||
            phase === "sidebar_my_content" ||
            phase === "sidebar_checked_out" ||
            myDocumentsRowSpotlight ||
            checkedOutRowSpotlight;

        if (!activeSpotlight) {
            setRect(null);
            clearSidebarTutorialStyles();
            clearTutorialDocRowStyles(docId);
            return;
        }

        const maybeScrollDocumentSpotlightForMeasure = (
            spotlightEl: HTMLElement,
        ): boolean => {
            const docSpotlightNeeded =
                myDocumentsRowSpotlight || checkedOutRowSpotlight;
            if (!docSpotlightNeeded) {
                return false;
            }

            const initiallyFullyVisible =
                isVerticallyFullyVisibleInScrollParents(
                    spotlightEl,
                    TUTORIAL_ROW_SCROLL_PADDING,
                );
            if (initiallyFullyVisible) {
                return false;
            }

            docSpotlightSmoothPendingRef.current = true;
            setRect(null);
            spotlightEl.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });

            if (docSpotlightSmoothTimerRef.current != null) {
                window.clearTimeout(docSpotlightSmoothTimerRef.current);
            }

            docSpotlightSmoothTimerRef.current = window.setTimeout(() => {
                docSpotlightSmoothTimerRef.current = null;
                docSpotlightSmoothPendingRef.current = false;

                const settled = resolveTutorialDocumentSpotlightEl(docId);
                if (!settled) {
                    setRect(null);
                    return;
                }

                scrollTutorialRowFullyIntoView(
                    settled,
                    TUTORIAL_ROW_SCROLL_PADDING,
                );

                const br = settled.getBoundingClientRect();
                setRect({
                    top: br.top - PADDING,
                    left: br.left - PADDING,
                    width: br.width + PADDING * 2,
                    height: br.height + PADDING * 2,
                });
                settled.style.position = "relative";
                settled.style.zIndex = String(TUTORIAL_HIGHLIGHT_Z);
            }, TUTORIAL_SMOOTH_SCROLL_SETTLE_MS);

            return true;
        };

        const measure = () => {
            if (
                (myDocumentsRowSpotlight || checkedOutRowSpotlight) &&
                docSpotlightSmoothPendingRef.current
            ) {
                return;
            }

            let el: HTMLElement | null = null;

            if (phase === "sidebar_highlight") {
                el = document.getElementById("tutorial-1");
            } else if (phase === "new_doc_highlight") {
                el = document.getElementById("tutorial-2");
            } else if (phase === "sidebar_my_content") {
                el = document.getElementById("tutorial-my-content-nav");
            } else if (phase === "sidebar_checked_out") {
                el = document.getElementById("tutorial-checked-out-nav");
            } else if (
                phase === "my_content_checkout" ||
                phase === "checked_out_edit" ||
                phase === "checked_out_delete"
            ) {
                el = resolveTutorialDocumentSpotlightEl(docId);
            }

            if (!el) {
                setRect(null);
                return;
            }

            if (maybeScrollDocumentSpotlightForMeasure(el)) {
                return;
            }

            const scrollMyContentSpotlight = myDocumentsRowSpotlight;
            const scrollCheckedOutSpotlight =
                checkedOutRowSpotlight &&
                (phase === "checked_out_edit" ||
                    phase === "checked_out_delete");

            if (scrollMyContentSpotlight || scrollCheckedOutSpotlight) {
                /** Center-first; instant here because we already smoothed when the tile was initially off-screen. */
                el.scrollIntoView({
                    behavior: "auto",
                    block: "center",
                    inline: "center",
                });
                scrollTutorialRowFullyIntoView(
                    el,
                    TUTORIAL_ROW_SCROLL_PADDING,
                );
            }

            const r = el.getBoundingClientRect();
            setRect({
                top: r.top - PADDING,
                left: r.left - PADDING,
                width: r.width + PADDING * 2,
                height: r.height + PADDING * 2,
            });
            const isSidebarNavPhase =
                phase === "sidebar_highlight" ||
                phase === "sidebar_my_content" ||
                phase === "sidebar_checked_out";
            if (isSidebarNavPhase) {
                return;
            }
            el.style.position = "relative";
            el.style.zIndex = String(TUTORIAL_HIGHLIGHT_Z);
        };

        measure();
        const t =
            phase === "sidebar_highlight" ||
            phase === "new_doc_highlight" ||
            phase === "sidebar_my_content" ||
            phase === "sidebar_checked_out" ||
            myDocumentsRowSpotlight ||
            checkedOutRowSpotlight
                ? window.setInterval(measure, 250)
                : undefined;
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        const observed = (() => {
            if (phase === "sidebar_highlight") return document.getElementById("tutorial-1");
            if (phase === "new_doc_highlight") return document.getElementById("tutorial-2");
            if (phase === "sidebar_my_content")
                return document.getElementById("tutorial-my-content-nav");
            if (phase === "sidebar_checked_out")
                return document.getElementById("tutorial-checked-out-nav");
            if (
                phase === "my_content_checkout" ||
                phase === "checked_out_edit" ||
                phase === "checked_out_delete"
            ) {
                return resolveTutorialDocumentSpotlightEl(docId);
            }
            return null;
        })();
        const ro = new ResizeObserver(measure);
        if (observed instanceof HTMLElement) ro.observe(observed);

        return () => {
            docSpotlightSmoothPendingRef.current = false;
            if (docSpotlightSmoothTimerRef.current != null) {
                window.clearTimeout(docSpotlightSmoothTimerRef.current);
                docSpotlightSmoothTimerRef.current = null;
            }
            if (t != null) window.clearInterval(t);
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
            ro.disconnect();
            clearSidebarTutorialStyles();
            clearTutorialDocRowStyles(docId);
        };
    }, [tutorial?.routeIsTutorial, tutorial?.phase, tutorial?.tutorialDocId, location.pathname]);

    useLayoutEffect(() => {
        if (!tutorial?.routeIsTutorial) return;
        if (tutorial.phase === "complete") return;
        if (
            tutorial.phase === "sidebar_highlight" ||
            tutorial.phase === "new_doc_highlight" ||
            tutorial.phase === "sidebar_my_content" ||
            tutorial.phase === "sidebar_checked_out" ||
            (tutorial.phase.startsWith("my_content") &&
                pathTutorialMyDocuments.test(location.pathname)) ||
            (tutorial.phase.startsWith("checked_out") &&
                pathTutorialCheckedOut.test(location.pathname))
        ) {
            setOpen(true);
        }
    }, [tutorial?.routeIsTutorial, tutorial?.phase, location.pathname, setOpen]);

    if (!tutorial?.routeIsTutorial || tutorial.phase === "inactive") {
        return null;
    }

    if (tutorial.phase === "complete") {
        return (
            <TutorialCompletionDialog
                titleId="document-tutorial-complete-title"
                title="Tutorial complete"
                description="You’ve finished the document walkthrough. You can start again anytime from Tutorials."
                onContinue={tutorial.acknowledgeDocumentTutorialComplete}
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
            className="fixed right-4 top-4 rounded-full shadow-md"
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
                titleId="tutorial-intro-title"
                title="Documents Tutorial"
                bullets={DOCUMENT_TUTORIAL_INTRO_BULLETS}
                dismissLabel={tutorial.introDismissLabel}
                onDismiss={tutorial.skipTutorial}
                onStart={tutorial.startTutorial}
                exitButton={exitButton}
            />
        );
    }

    if (tutorial.phase === "form") {
        return createPortal(<>{exitButton}</>, document.body);
    }

    const listCaption = (() => {
        if (tutorial.phase === "my_content_checkout") {
            return "Open the ⋯ menu on this row and choose Check out so you can edit the document.";
        }
        if (tutorial.phase === "sidebar_checked_out") {
            return "Under Content, click Checked out to see documents you’re editing.";
        }
        return null;
    })();

    const checkedOutCoachPanel =
        pathTutorialCheckedOut.test(location.pathname) &&
        tutorial.tutorialDocId != null &&
        (tutorial.phase === "checked_out_edit" ||
            tutorial.phase === "checked_out_delete");

    const hasListSpotlightRect =
        Boolean(rect) &&
        (tutorial.phase === "sidebar_highlight" ||
            tutorial.phase === "new_doc_highlight" ||
            tutorial.phase === "sidebar_my_content" ||
            tutorial.phase === "sidebar_checked_out" ||
            (tutorial.phase === "my_content_checkout" &&
                pathTutorialMyDocuments.test(location.pathname) &&
                tutorial.tutorialDocId != null) ||
            ((tutorial.phase === "checked_out_edit" ||
                tutorial.phase === "checked_out_delete") &&
                pathTutorialCheckedOut.test(location.pathname) &&
                tutorial.tutorialDocId != null));

    if (hasListSpotlightRect) {
        const sidebarCaption =
            tutorial.phase === "sidebar_highlight"
                ? "Open Content to view all documents."
                : tutorial.phase === "new_doc_highlight"
                  ? 'Click "+ New Document" to open the form.'
                  : tutorial.phase === "sidebar_my_content"
                    ? "Under Content, click My content to open your library and continue."
                    : null;

        const caption = sidebarCaption ?? listCaption;

        return createPortal(
            <>
                {exitButton}
                <TutorialDimOverlay onPointerDown={blockBackground} />
                <TutorialSidebarNavReplica
                    active={
                        (tutorial.phase === "sidebar_highlight" ||
                            tutorial.phase === "sidebar_my_content" ||
                            tutorial.phase === "sidebar_checked_out") &&
                        Boolean(rect)
                    }
                    targetId={
                        tutorial.phase === "sidebar_highlight"
                            ? "tutorial-1"
                            : tutorial.phase === "sidebar_my_content"
                              ? "tutorial-my-content-nav"
                              : tutorial.phase === "sidebar_checked_out"
                                ? "tutorial-checked-out-nav"
                                : ""
                    }
                />
                {checkedOutCoachPanel ? (
                    <TutorialCheckedOutPanel
                        phase={
                            tutorial.phase === "checked_out_delete"
                                ? "checked_out_delete"
                                : "checked_out_edit"
                        }
                        docId={tutorial.tutorialDocId}
                    />
                ) : tutorial.phase === "my_content_checkout" ? (
                    <div
                        className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2"
                        style={{ zIndex: CAPTION_Z }}
                    >
                        <div
                            className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-popover px-4 py-3 text-center text-sm leading-snug text-popover-foreground shadow-lg sm:text-left"
                            role="status"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {caption ? <p className="mb-0">{caption}</p> : null}
                        </div>
                    </div>
                ) : (
                    <div
                        className="fixed rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg"
                        style={(() => {
                            const captionWidth = Math.min(
                                288,
                                typeof window !== "undefined"
                                    ? window.innerWidth - 32
                                    : 288,
                            );
                            const estHeight = EST_CAPTION_DEFAULT;
                            if (!rect) {
                                return {
                                    zIndex: CAPTION_Z,
                                    maxWidth: captionWidth,
                                };
                            }
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
                        role="status"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {caption ? <p className="mb-3">{caption}</p> : null}
                    </div>
                )}
            </>,
            document.body,
        );
    }

    if (
        tutorial.phase === "sidebar_highlight" ||
        tutorial.phase === "new_doc_highlight" ||
        tutorial.phase === "sidebar_my_content"
    ) {
        return createPortal(
            <>
                {exitButton}
                <TutorialDimOverlay onPointerDown={blockBackground} />
            </>,
            document.body,
        );
    }

    const loadingOnMyDocuments =
        tutorial.phase === "my_content_loading" &&
        pathTutorialMyDocuments.test(location.pathname) &&
        tutorial.tutorialDocId != null;

    const loadingOnCheckedOut =
        tutorial.phase === "checked_out_loading" &&
        pathTutorialCheckedOut.test(location.pathname) &&
        tutorial.tutorialDocId != null;

    if (loadingOnMyDocuments || loadingOnCheckedOut) {
        return createPortal(
            <>
                {exitButton}
                <TutorialDimOverlay onPointerDown={blockBackground} />
                <div
                    className="fixed inset-0 flex flex-col items-center justify-center gap-4 p-4"
                    style={{ zIndex: CAPTION_Z }}
                    role="status"
                    aria-live="polite"
                    onPointerDown={blockBackground}
                >
                    <Loader2
                        className="size-10 animate-spin text-primary"
                        aria-hidden
                    />
                    <p className="max-w-sm rounded-lg border border-border bg-popover px-4 py-3 text-center text-sm text-popover-foreground shadow-lg">
                        {loadingOnCheckedOut
                            ? "Loading checked-out documents…"
                            : "Loading your documents…"}
                    </p>
                </div>
            </>,
            document.body,
        );
    }

    const rowSpotlightWithoutRect =
        tutorial.tutorialDocId != null &&
        ((tutorial.phase === "my_content_checkout" &&
            pathTutorialMyDocuments.test(location.pathname)) ||
            ((tutorial.phase === "checked_out_edit" ||
                tutorial.phase === "checked_out_delete") &&
                pathTutorialCheckedOut.test(location.pathname)) ||
            tutorial.phase === "sidebar_checked_out");

    if (rowSpotlightWithoutRect && !rect) {
        return createPortal(
            <>
                {exitButton}
                <TutorialDimOverlay onPointerDown={blockBackground} />
                {checkedOutCoachPanel ? (
                    <TutorialCheckedOutPanel
                        phase={
                            tutorial.phase === "checked_out_delete"
                                ? "checked_out_delete"
                                : "checked_out_edit"
                        }
                        docId={tutorial.tutorialDocId}
                    />
                ) : null}
                {tutorial.phase === "my_content_checkout" &&
                pathTutorialMyDocuments.test(location.pathname) &&
                tutorial.tutorialDocId != null ? (
                    <div
                        className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2"
                        style={{ zIndex: CAPTION_Z }}
                    >
                        <div
                            className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-popover px-4 py-3 text-center text-sm leading-snug text-popover-foreground shadow-lg sm:text-left"
                            role="status"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {listCaption ? (
                                <p className="mb-0">{listCaption}</p>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </>,
            document.body,
        );
    }

    return createPortal(<>{exitButton}</>, document.body);
}
