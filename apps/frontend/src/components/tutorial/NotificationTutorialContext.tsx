import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { setInboxTutorialSession } from "@/components/tutorial/inboxTutorialStorage.ts";

const MAIN_STEP_ORDER = [
  "nt_main_status",
  "nt_main_sort",
  "nt_main_select",
  "nt_main_refresh",
  "nt_main_list",
] as const;

export type NotificationTutorialMainStep = (typeof MAIN_STEP_ORDER)[number];

export type NotificationTutorialPhase =
  | "inactive"
  | "intro"
  | "sidebar_inbox_nav"
  | NotificationTutorialMainStep
  | "complete";

type NotificationTutorialContextValue = {
  routeIsNotificationsTutorial: boolean;
  phase: NotificationTutorialPhase;
  startTutorial: () => void;
  skipTutorial: () => void;
  exitTutorial: () => void;
  completeTutorial: () => void;
  acknowledgeNotificationTutorialComplete: () => void;
  notifyInboxListRouteEntered: () => void;
  continueNotificationTutorial: () => void;
};

const NotificationTutorialContext =
  createContext<NotificationTutorialContextValue | null>(null);

export function useNotificationTutorial(): NotificationTutorialContextValue | null {
  return useContext(NotificationTutorialContext);
}

type Props = {
  children: ReactNode;
  routeIsNotificationsTutorial: boolean;
};

export function NotificationTutorialProvider({
  children,
  routeIsNotificationsTutorial,
}: Props) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<NotificationTutorialPhase>("inactive");

  const prevNtTutorialRef = useRef(false);
  useEffect(() => {
    const prev = prevNtTutorialRef.current;
    prevNtTutorialRef.current = routeIsNotificationsTutorial;
    if (!routeIsNotificationsTutorial) {
      setPhase("inactive");
      return;
    }
    if (!prev) {
      setPhase("intro");
    }
  }, [routeIsNotificationsTutorial]);

  const exitWithoutCompletion = useCallback(() => {
    setPhase("inactive");
    setInboxTutorialSession(false);
    navigate("/documents/tutorials");
  }, [navigate]);

  const acknowledgeNotificationTutorialComplete = useCallback(() => {
    setPhase("inactive");
    setInboxTutorialSession(false);
    navigate("/documents/tutorials");
  }, [navigate]);

  const startTutorial = useCallback(() => {
    setPhase("sidebar_inbox_nav");
  }, []);

  const skipTutorial = useCallback(() => {
    exitWithoutCompletion();
  }, [exitWithoutCompletion]);

  const exitTutorial = useCallback(() => {
    exitWithoutCompletion();
  }, [exitWithoutCompletion]);

  const completeTutorial = useCallback(() => {
    if (!routeIsNotificationsTutorial) return;
    setPhase("complete");
  }, [routeIsNotificationsTutorial]);

  const notifyInboxListRouteEntered = useCallback(() => {
    if (!routeIsNotificationsTutorial) return;
    setPhase((p) => (p === "sidebar_inbox_nav" ? "nt_main_status" : p));
  }, [routeIsNotificationsTutorial]);

  const continueNotificationTutorial = useCallback(() => {
    if (!routeIsNotificationsTutorial) return;
    setPhase((p) => {
      const i = MAIN_STEP_ORDER.indexOf(p as NotificationTutorialMainStep);
      if (i >= 0 && i < MAIN_STEP_ORDER.length - 1) {
        return MAIN_STEP_ORDER[i + 1]!;
      }
      return p;
    });
  }, [routeIsNotificationsTutorial]);

  const value = useMemo<NotificationTutorialContextValue>(
    () => ({
      routeIsNotificationsTutorial,
      phase,
      startTutorial,
      skipTutorial,
      exitTutorial,
      completeTutorial,
      acknowledgeNotificationTutorialComplete,
      notifyInboxListRouteEntered,
      continueNotificationTutorial,
    }),
    [
      routeIsNotificationsTutorial,
      phase,
      startTutorial,
      skipTutorial,
      exitTutorial,
      completeTutorial,
      acknowledgeNotificationTutorialComplete,
      notifyInboxListRouteEntered,
      continueNotificationTutorial,
    ],
  );

  return (
    <NotificationTutorialContext.Provider value={value}>
      {children}
    </NotificationTutorialContext.Provider>
  );
}
