import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type TutorialPhase =
    | "inactive"
    | "intro"
    | "sidebar_highlight"
    | "new_doc_highlight"
    | "form"
    /** Navigated to My content; list fetch must finish before spotlighting the new row. */
    | "my_content_loading"
    | "my_content_see_doc"
    /** Open ⋯ and check out the tutorial document on My content. */
    | "my_content_checkout"
    /** After checkout; user clicks Checked out in the sidebar. */
    | "sidebar_checked_out"
    /** On Checked out route; list fetch must finish. */
    | "checked_out_loading"
    | "checked_out_edit"
    | "checked_out_delete";

type TutorialContextValue = {
    routeIsTutorial: boolean;
    phase: TutorialPhase;
    tutorialDocId: number | null;
    startTutorial: () => void;
    skipTutorial: () => void;
    exitTutorial: () => void;
    notifyAddDialogOpen: (open: boolean) => void;
    notifyTutorialDocumentCreated: (contentId: number) => void;
    /** Call when My content list has loaded and includes the tutorial document id. */
    notifyTutorialMyContentListReady: () => void;
    continueTutorialMyContentAfterSeeDoc: () => void;
    /** After successful check out of the tutorial document (still on My content). */
    notifyTutorialDocumentCheckedOut: () => void;
    /** Call when Checked out list has loaded and includes the tutorial document id. */
    notifyTutorialCheckedOutListReady: () => void;
    advanceTutorialAfterEdit: () => void;
    finishTutorialAfterDelete: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue | null {
    return useContext(TutorialContext);
}

type TutorialProviderProps = {
    children: ReactNode;
    routeIsTutorial: boolean;
    /** After `documentTutorialShown` is saved; syncs client so auto-redirect stops. */
    onDocumentTutorialMarkedOnServer?: () => void | Promise<void>;
};

export function TutorialProvider({
    children,
    routeIsTutorial,
    onDocumentTutorialMarkedOnServer,
}: TutorialProviderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [phase, setPhase] = useState<TutorialPhase>("inactive");
    const [tutorialDocId, setTutorialDocId] = useState<number | null>(null);

    useEffect(() => {
        if (!routeIsTutorial) {
            setPhase("inactive");
            setTutorialDocId(null);
            return;
        }
        setPhase("intro");
        setTutorialDocId(null);
    }, [routeIsTutorial]);

    /** Persist “tutorial has been presented” for first-login gating. */
    useEffect(() => {
        if (!routeIsTutorial || phase !== "intro") return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/me/document-tutorial-shown`,
                    { method: "POST", credentials: "include" },
                );
                if (!cancelled && res.ok) {
                    await onDocumentTutorialMarkedOnServer?.();
                }
            } catch {
                /* offline / server error — refetch on route change may still recover */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [routeIsTutorial, phase, onDocumentTutorialMarkedOnServer]);

    useEffect(() => {
        if (!routeIsTutorial) return;
        if (phase !== "sidebar_highlight") return;
        if (/\/tutorial\/all\/?$/.test(location.pathname)) {
            setPhase("new_doc_highlight");
        }
    }, [routeIsTutorial, phase, location.pathname]);

    useEffect(() => {
        if (!routeIsTutorial) return;
        if (phase !== "sidebar_checked_out") return;
        if (/\/tutorial\/checked-out\/?$/.test(location.pathname)) {
            setPhase("checked_out_loading");
        }
    }, [routeIsTutorial, phase, location.pathname]);

    const resetAndLeave = useCallback(() => {
        setTutorialDocId(null);
        setPhase("inactive");
        navigate("/documents");
    }, [navigate]);

    const startTutorial = useCallback(() => {
        setPhase("sidebar_highlight");
    }, []);

    const skipTutorial = useCallback(() => {
        resetAndLeave();
    }, [resetAndLeave]);

    const exitTutorial = useCallback(() => {
        resetAndLeave();
    }, [resetAndLeave]);

    const notifyAddDialogOpen = useCallback((open: boolean) => {
        if (!routeIsTutorial) return;
        setPhase((p) => {
            if (open) return "form";
            if (p === "form") return "new_doc_highlight";
            return p;
        });
    }, [routeIsTutorial]);

    const notifyTutorialDocumentCreated = useCallback(
        (contentId: number) => {
            if (!routeIsTutorial) return;
            setTutorialDocId(contentId);
            setPhase("my_content_loading");
            navigate("/tutorial/my-documents");
        },
        [navigate, routeIsTutorial],
    );

    const notifyTutorialMyContentListReady = useCallback(() => {
        if (!routeIsTutorial) return;
        setPhase((p) => (p === "my_content_loading" ? "my_content_see_doc" : p));
    }, [routeIsTutorial]);

    const continueTutorialMyContentAfterSeeDoc = useCallback(() => {
        if (!routeIsTutorial) return;
        setPhase("my_content_checkout");
    }, [routeIsTutorial]);

    const notifyTutorialDocumentCheckedOut = useCallback(() => {
        if (!routeIsTutorial) return;
        setPhase((p) =>
            p === "my_content_checkout" ? "sidebar_checked_out" : p,
        );
    }, [routeIsTutorial]);

    const notifyTutorialCheckedOutListReady = useCallback(() => {
        if (!routeIsTutorial) return;
        setPhase((p) => (p === "checked_out_loading" ? "checked_out_delete" : p));
    }, [routeIsTutorial]);

    const advanceTutorialAfterEdit = useCallback(() => {
        if (!routeIsTutorial) return;
        setPhase("checked_out_delete");
    }, [routeIsTutorial]);

    const finishTutorialAfterDelete = useCallback(() => {
        resetAndLeave();
    }, [resetAndLeave]);

    const value = useMemo<TutorialContextValue>(
        () => ({
            routeIsTutorial,
            phase,
            tutorialDocId,
            startTutorial,
            skipTutorial,
            exitTutorial,
            notifyAddDialogOpen,
            notifyTutorialDocumentCreated,
            notifyTutorialMyContentListReady,
            continueTutorialMyContentAfterSeeDoc,
            notifyTutorialDocumentCheckedOut,
            notifyTutorialCheckedOutListReady,
            advanceTutorialAfterEdit,
            finishTutorialAfterDelete,
        }),
        [
            routeIsTutorial,
            phase,
            tutorialDocId,
            startTutorial,
            skipTutorial,
            exitTutorial,
            notifyAddDialogOpen,
            notifyTutorialDocumentCreated,
            notifyTutorialMyContentListReady,
            continueTutorialMyContentAfterSeeDoc,
            notifyTutorialDocumentCheckedOut,
            notifyTutorialCheckedOutListReady,
            advanceTutorialAfterEdit,
            finishTutorialAfterDelete,
        ],
    );

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}
