import { useTutorial } from "@/components/tutorial/TutorialContext.tsx";
import { TutorialCheckedOutPanel } from "@/components/tutorial/TutorialCheckedOutPanel.tsx";
import {
    setTutorialSidebarStackElevation,
    TutorialDimOverlay,
    TUTORIAL_HIGHLIGHT_Z,
} from "@/components/tutorial/tutorialDimOverlay.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { useSidebar } from "@/elements/sidebar-elements.tsx";
import { X, Loader2 } from "lucide-react";
import {
    useLayoutEffect,
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

/** Padding when scrolling a tutorial row inside nested `overflow-auto` regions (e.g. document list). */
const TUTORIAL_ROW_SCROLL_PADDING = 16;

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

/** Approx heights for captions anchored with `top` to spotlight rects. */
const EST_CAPTION_MY_CONTENT_SEE_DOC = 140;
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

export function TutorialCoach() {
    const tutorial = useTutorial();
    const location = useLocation();
    const { setOpen } = useSidebar();
    const [rect, setRect] = useState<{
        top: number;
        left: number;
        width: number;
        height: number;
    } | null>(null);

    useLayoutEffect(() => {
        if (!tutorial?.routeIsTutorial) {
            setRect(null);
            return;
        }

        const phase = tutorial.phase;
        const docId = tutorial.tutorialDocId;
        const onMyDocuments = pathTutorialMyDocuments.test(location.pathname);
        const onCheckedOut = pathTutorialCheckedOut.test(location.pathname);

        const myDocumentsRowSpotlight =
            onMyDocuments &&
            docId != null &&
            (phase === "my_content_see_doc" || phase === "my_content_checkout");

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

        const measure = () => {
            let el: HTMLElement | null = null;

            if (phase === "sidebar_highlight") {
                el = document.getElementById("tutorial-1");
            } else if (phase === "new_doc_highlight") {
                el = document.getElementById("tutorial-2");
            } else if (phase === "sidebar_my_content") {
                el = document.getElementById("tutorial-my-content-nav");
            } else if (phase === "sidebar_checked_out") {
                el = document.getElementById("tutorial-checked-out-nav");
            } else if (phase === "my_content_see_doc") {
                el = document.querySelector("[data-tutorial-doc-card]");
            } else if (
                phase === "my_content_checkout" ||
                phase === "checked_out_edit" ||
                phase === "checked_out_delete"
            ) {
                el = document.querySelector(`[data-document-menu-trigger="${docId}"]`);
            }

            if (!el) {
                setRect(null);
                return;
            }

            const scrollMyContentSpotlight =
                myDocumentsRowSpotlight &&
                (phase === "my_content_see_doc" ||
                    phase === "my_content_checkout");
            const scrollCheckedOutSpotlight =
                checkedOutRowSpotlight &&
                (phase === "checked_out_edit" ||
                    phase === "checked_out_delete");

            if (scrollMyContentSpotlight || scrollCheckedOutSpotlight) {
                if (
                    !isVerticallyFullyVisibleInScrollParents(
                        el,
                        TUTORIAL_ROW_SCROLL_PADDING,
                    )
                ) {
                    el.scrollIntoView({
                        behavior: "auto",
                        block: "nearest",
                        inline: "nearest",
                    });
                    scrollTutorialRowFullyIntoView(
                        el,
                        TUTORIAL_ROW_SCROLL_PADDING,
                    );
                }
            }

            const r = el.getBoundingClientRect();
            setRect({
                top: r.top - PADDING,
                left: r.left - PADDING,
                width: r.width + PADDING * 2,
                height: r.height + PADDING * 2,
            });
            el.style.position = "relative";
            el.style.zIndex = String(TUTORIAL_HIGHLIGHT_Z);
        };

        measure();
        const t =
            myDocumentsRowSpotlight || checkedOutRowSpotlight
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
            if (phase === "my_content_see_doc") {
                return document.querySelector("[data-tutorial-doc-card]");
            }
            if (
                phase === "my_content_checkout" ||
                phase === "checked_out_edit" ||
                phase === "checked_out_delete"
            ) {
                return document.querySelector(`[data-document-menu-trigger="${docId}"]`);
            }
            return null;
        })();
        const ro = new ResizeObserver(measure);
        if (observed instanceof HTMLElement) ro.observe(observed);

        return () => {
            if (t != null) window.clearInterval(t);
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
            ro.disconnect();
            clearSidebarTutorialStyles();
            clearTutorialDocRowStyles(docId);
        };
    }, [tutorial?.routeIsTutorial, tutorial?.phase, tutorial?.tutorialDocId, location.pathname]);

    /** Sidebar layout uses `z-10`; lift it above the portaled dim so in-sidebar targets stay clickable. */
    useLayoutEffect(() => {
        if (!tutorial?.routeIsTutorial) {
            setTutorialSidebarStackElevation(false);
            return;
        }
        const lift =
            tutorial.phase === "sidebar_highlight" ||
            tutorial.phase === "sidebar_my_content" ||
            tutorial.phase === "sidebar_checked_out";
        setTutorialSidebarStackElevation(lift);
        return () => setTutorialSidebarStackElevation(false);
    }, [tutorial?.routeIsTutorial, tutorial?.phase]);

    useLayoutEffect(() => {
        if (!tutorial?.routeIsTutorial) return;
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
                        aria-labelledby="tutorial-intro-title"
                        aria-modal="true"
                    >
                        <h2
                            id="tutorial-intro-title"
                            className="mb-2 text-lg font-semibold"
                        >
                            Welcome to the document tutorial
                        </h2>
                        <p className="mb-6 text-sm text-muted-foreground">
                            You’ll learn how to create a document, find it on My content, check it
                            out, open it from Checked out, then edit and delete it. You can exit
                            anytime with the button above.
                        </p>
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button type="button" variant="outline" onClick={tutorial.skipTutorial}>
                                Skip
                            </Button>
                            <Button type="button" onClick={tutorial.startTutorial}>
                                Start tutorial
                            </Button>
                        </div>
                    </div>
                </div>
            </>,
            document.body,
        );
    }

    if (tutorial.phase === "form") {
        return createPortal(<>{exitButton}</>, document.body);
    }

    const listCaption = (() => {
        if (tutorial.phase === "my_content_see_doc") {
            return "Documents you create show up here on My content. Here’s the one you just saved—next you’ll check it out.";
        }
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
            ((tutorial.phase === "my_content_see_doc" ||
                tutorial.phase === "my_content_checkout") &&
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
                            const estHeight =
                                tutorial.phase === "my_content_see_doc"
                                    ? EST_CAPTION_MY_CONTENT_SEE_DOC
                                    : EST_CAPTION_DEFAULT;
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
                        {tutorial.phase === "my_content_see_doc" ? (
                            <Button
                                type="button"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                    tutorial.continueTutorialMyContentAfterSeeDoc()
                                }
                            >
                                Continue
                            </Button>
                        ) : null}
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
        (((tutorial.phase === "my_content_see_doc" ||
            tutorial.phase === "my_content_checkout") &&
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
            </>,
            document.body,
        );
    }

    return createPortal(<>{exitButton}</>, document.body);
}
