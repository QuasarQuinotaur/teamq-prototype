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
  | ServiceRequestTutorialMainStep;

type ServiceRequestTutorialContextValue = {
  routeIsSrTutorial: boolean;
  phase: ServiceRequestTutorialPhase;
  startTutorial: () => void;
  skipTutorial: () => void;
  exitTutorial: () => void;
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

  const prevSrTutorialRef = useRef(routeIsSrTutorial);
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

  const resetAndLeave = useCallback(() => {
    setPhase("inactive");
    setServiceRequestTutorialSession(false);
    navigate("/documents/help");
  }, [navigate]);

  const startTutorial = useCallback(() => {
    setPhase("sidebar_sr_nav");
  }, []);

  const skipTutorial = useCallback(() => {
    resetAndLeave();
  }, [resetAndLeave]);

  const exitTutorial = useCallback(() => {
    resetAndLeave();
  }, [resetAndLeave]);

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
      notifySrListRouteEntered,
      continueSrTutorial,
    }),
    [
      routeIsSrTutorial,
      phase,
      startTutorial,
      skipTutorial,
      exitTutorial,
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
