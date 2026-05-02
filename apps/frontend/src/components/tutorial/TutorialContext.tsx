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
    /** After save: user clicks My content in the sidebar before we load the list. */
    | "sidebar_my_content"
    /** On My content; list fetch must finish before spotlighting the row menu. */
    | "my_content_loading"
    /** Open ⋯ and check out the tutorial document on My content. */
    | "my_content_checkout"
    /** After checkout; user clicks Checked out in the sidebar. */
    | "sidebar_checked_out"
    /** On Checked out route; list fetch must finish. */
    | "checked_out_loading"
    | "checked_out_edit"
    | "checked_out_delete"
    /** User finished the flow; show completion UI then return to Tutorials. */
    | "complete";

type TutorialContextValue = {
    routeIsTutorial: boolean;
    /** First presentation after login (document tutorial auto-opens); intro uses Skip / Start vs Cancel / Start. */
    introDismissLabel: "Skip" | "Cancel";
    phase: TutorialPhase;
    tutorialDocId: number | null;
    startTutorial: () => void;
    skipTutorial: () => void;
    exitTutorial: () => void;
    /** After deleting the tutorial document; opens completion dialog (not used for X / Skip). */
    acknowledgeDocumentTutorialComplete: () => void;
    notifyAddDialogOpen: (open: boolean) => void;
    notifyTutorialDocumentCreated: (contentId: number) => void;
    /** Call when My content list has loaded and includes the tutorial document id. */
    notifyTutorialMyContentListReady: () => void;
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
    /** Captured when entering the document tutorial route; stable while refetch sets `documentTutorialShown`. */
    documentTutorialIntroFromFirstLogin?: boolean;
    /** After `documentTutorialShown` is saved; syncs client so auto-redirect stops. */
    onDocumentTutorialMarkedOnServer?: () => void | Promise<void>;
};

export function TutorialProvider({
    children,
    routeIsTutorial,
    documentTutorialIntroFromFirstLogin = false,
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

    useEffect(() => {
        if (!routeIsTutorial) return;
        if (phase !== "sidebar_my_content") return;
        if (/\/tutorial\/my-documents\/?$/.test(location.pathname)) {
            setPhase("my_content_loading");
        }
    }, [routeIsTutorial, phase, location.pathname]);

    const exitWithoutCompletion = useCallback(() => {
        setTutorialDocId(null);
        setPhase("inactive");
        navigate("/documents/tutorials");
    }, [navigate]);

    const acknowledgeDocumentTutorialComplete = useCallback(() => {
        setTutorialDocId(null);
        setPhase("inactive");
        navigate("/documents/tutorials");
    }, [navigate]);

    const startTutorial = useCallback(() => {
        setPhase("sidebar_highlight");
    }, []);

    const skipTutorial = useCallback(() => {
        exitWithoutCompletion();
    }, [exitWithoutCompletion]);

    const exitTutorial = useCallback(() => {
        exitWithoutCompletion();
    }, [exitWithoutCompletion]);

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
            setPhase("sidebar_my_content");
        },
        [routeIsTutorial],
    );

    const notifyTutorialMyContentListReady = useCallback(() => {
        if (!routeIsTutorial) return;
        setPhase((p) => (p === "my_content_loading" ? "my_content_checkout" : p));
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
        if (!routeIsTutorial) return;
        setPhase("complete");
    }, [routeIsTutorial]);

    const introDismissLabel: "Skip" | "Cancel" =
        documentTutorialIntroFromFirstLogin ? "Skip" : "Cancel";

    const value = useMemo<TutorialContextValue>(
        () => ({
            routeIsTutorial,
            introDismissLabel,
            phase,
            tutorialDocId,
            startTutorial,
            skipTutorial,
            exitTutorial,
            acknowledgeDocumentTutorialComplete,
            notifyAddDialogOpen,
            notifyTutorialDocumentCreated,
            notifyTutorialMyContentListReady,
            notifyTutorialDocumentCheckedOut,
            notifyTutorialCheckedOutListReady,
            advanceTutorialAfterEdit,
            finishTutorialAfterDelete,
        }),
        [
            routeIsTutorial,
            introDismissLabel,
            phase,
            tutorialDocId,
            startTutorial,
            skipTutorial,
            exitTutorial,
            acknowledgeDocumentTutorialComplete,
            notifyAddDialogOpen,
            notifyTutorialDocumentCreated,
            notifyTutorialMyContentListReady,
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
