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
import { setServiceRequestTutorialSession } from "@/components/tutorial/serviceRequestTutorialStorage.ts";

/** Main-page spotlight steps (after user opens Service requests from the sidebar). */
const MAIN_STEP_ORDER = [
  "sr_main_search",
  "sr_main_new",
  "sr_main_presets",
  "sr_main_filter",
  "sr_main_sort",
  "sr_main_list",
] as const;

export type ServiceRequestTutorialMainStep = (typeof MAIN_STEP_ORDER)[number];

export type ServiceRequestTutorialPhase =
  | "inactive"
  | "intro"
  | "sidebar_sr_nav"
  | ServiceRequestTutorialMainStep
  | "complete";

type ServiceRequestTutorialContextValue = {
  routeIsSrTutorial: boolean;
  phase: ServiceRequestTutorialPhase;
  startTutorial: () => void;
  skipTutorial: () => void;
  exitTutorial: () => void;
  /** User pressed Done on the final spotlight step; opens completion dialog. */
  completeTutorial: () => void;
  acknowledgeServiceRequestTutorialComplete: () => void;
  /** Call when user lands on the service-requests list after sidebar step */
  notifySrListRouteEntered: () => void;
  /** Advance within main-page steps, or exit after the last step */
  continueSrTutorial: () => void;
};

const ServiceRequestTutorialContext =
  createContext<ServiceRequestTutorialContextValue | null>(null);

export function useServiceRequestTutorial(): ServiceRequestTutorialContextValue | null {
  return useContext(ServiceRequestTutorialContext);
}

type Props = {
  children: ReactNode;
  routeIsSrTutorial: boolean;
};

export function ServiceRequestTutorialProvider({
  children,
  routeIsSrTutorial,
}: Props) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ServiceRequestTutorialPhase>("inactive");

  /** Tracks last `routeIsSrTutorial` seen by the effect—not the mount value—so mounting already on `/tutorial/dashboard` still opens intro. */
  const prevSrTutorialRef = useRef(false);
  useEffect(() => {
    const prev = prevSrTutorialRef.current;
    prevSrTutorialRef.current = routeIsSrTutorial;
    if (!routeIsSrTutorial) {
      setPhase("inactive");
      return;
    }
    if (!prev) {
      setPhase("intro");
    }
  }, [routeIsSrTutorial]);

  const exitWithoutCompletion = useCallback(() => {
    setPhase("inactive");
    setServiceRequestTutorialSession(false);
    navigate("/documents/tutorials");
  }, [navigate]);

  const acknowledgeServiceRequestTutorialComplete = useCallback(() => {
    setPhase("inactive");
    setServiceRequestTutorialSession(false);
    navigate("/documents/tutorials");
  }, [navigate]);

  const startTutorial = useCallback(() => {
    setPhase("sidebar_sr_nav");
  }, []);

  const skipTutorial = useCallback(() => {
    exitWithoutCompletion();
  }, [exitWithoutCompletion]);

  const exitTutorial = useCallback(() => {
    exitWithoutCompletion();
  }, [exitWithoutCompletion]);

  const completeTutorial = useCallback(() => {
    if (!routeIsSrTutorial) return;
    setPhase("complete");
  }, [routeIsSrTutorial]);

  const notifySrListRouteEntered = useCallback(() => {
    if (!routeIsSrTutorial) return;
    setPhase((p) => (p === "sidebar_sr_nav" ? "sr_main_search" : p));
  }, [routeIsSrTutorial]);

  const continueSrTutorial = useCallback(() => {
    if (!routeIsSrTutorial) return;
    setPhase((p) => {
      const i = MAIN_STEP_ORDER.indexOf(p as ServiceRequestTutorialMainStep);
      if (i >= 0 && i < MAIN_STEP_ORDER.length - 1) {
        return MAIN_STEP_ORDER[i + 1]!;
      }
      return p;
    });
  }, [routeIsSrTutorial]);

  const value = useMemo<ServiceRequestTutorialContextValue>(
    () => ({
      routeIsSrTutorial,
      phase,
      startTutorial,
      skipTutorial,
      exitTutorial,
      completeTutorial,
      acknowledgeServiceRequestTutorialComplete,
      notifySrListRouteEntered,
      continueSrTutorial,
    }),
    [
      routeIsSrTutorial,
      phase,
      startTutorial,
      skipTutorial,
      exitTutorial,
      completeTutorial,
      acknowledgeServiceRequestTutorialComplete,
      notifySrListRouteEntered,
      continueSrTutorial,
    ],
  );

  return (
    <ServiceRequestTutorialContext.Provider value={value}>
      {children}
    </ServiceRequestTutorialContext.Provider>
  );
}
