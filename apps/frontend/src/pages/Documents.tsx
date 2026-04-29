import { AppSidebar } from "@/components/sidebar/Sidebar.tsx"
import {
  SidebarInset,
  SidebarProvider,
} from "@/elements/sidebar-elements.tsx"
import { TutorialCoach } from "@/components/tutorial/TutorialCoach.tsx";
import { TutorialProvider } from "@/components/tutorial/TutorialContext.tsx";
import { ServiceRequestTutorialProvider } from "@/components/tutorial/ServiceRequestTutorialContext.tsx";
import { ServiceRequestTutorialCoach } from "@/components/tutorial/ServiceRequestTutorialCoach.tsx";
import {
  readServiceRequestTutorialSession,
  setServiceRequestTutorialSession,
} from "@/components/tutorial/serviceRequestTutorialStorage.ts";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useUserLink } from "@/hooks/useUserLink";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import NotificationPoller from "@/components/notifications/NotificationPoller.tsx";
import { applyTheme, THEME_IDS, type ThemeId, applyTextSize, applyIconSize, type SizeValue, storeView } from "@/lib/theme.ts";
import type { ViewType } from "@/components/auth/hooks/use-create-main-context.tsx";

function useApplySettings(
  setTagsEnabled: (v: boolean) => void,
  setView: (v: ViewType) => void,
) {
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/settings`, {
      credentials: "include",
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        const lower = (data.theme as string).toLowerCase();
        const theme = (THEME_IDS as readonly string[]).includes(lower)
          ? (lower as ThemeId)
          : null;
        if (theme) applyTheme(theme);
        if (data.textSize) applyTextSize(data.textSize as SizeValue);
        if (data.iconSize) applyIconSize(data.iconSize as SizeValue);
        setTagsEnabled(data.tagsEnabled ?? true);
        const view = data.listEnabled ? "List" : "Grid";
        storeView(view);
        setView(view);
      })
      .catch(() => {});
  }, []);
}

export default function Documents() {
  const { isLoading, documentTutorialShown, refetchTutorialEligibility } =
    useUserLink();
  const navigate = useNavigate();
  const location = useLocation();
  const tutorialAutoNavDone = useRef(false);
  const priorPathWasTutorial = useRef(false);

  useEffect(() => {
    const onTutorial = location.pathname.startsWith("/tutorial");
    if (priorPathWasTutorial.current && !onTutorial) {
      void refetchTutorialEligibility();
    }
    priorPathWasTutorial.current = onTutorial;
  }, [location.pathname, refetchTutorialEligibility]);

  useEffect(() => {
    if (isLoading || documentTutorialShown !== false) {
      return;
    }
    if (!location.pathname.startsWith("/documents")) {
      return;
    }
    if (tutorialAutoNavDone.current) {
      return;
    }
    tutorialAutoNavDone.current = true;
    navigate("/tutorial/all", { replace: true });
  }, [isLoading, documentTutorialShown, location.pathname, navigate]);

  useEffect(() => {
    const p = location.pathname;
    if (
      p.startsWith("/tutorial/all") ||
      p.startsWith("/tutorial/my-documents") ||
      p.startsWith("/tutorial/checked-out")
    ) {
      setServiceRequestTutorialSession(false);
    }
  }, [location.pathname]);

  // Pass context down
  const mainContext = useMainContext();
  useApplySettings(mainContext.setTagsEnabled, mainContext.setView);

  const srTutorialSession = readServiceRequestTutorialSession();
  const onDocumentTutorialPath =
    location.pathname.startsWith("/tutorial/all") ||
    location.pathname.startsWith("/tutorial/my-documents") ||
    location.pathname.startsWith("/tutorial/checked-out");

  /** Help “Service requests tutorial” navigates here; only used for SR tour (do not rely on sessionStorage racing the first paint). */
  const onSrTutorialEntryDashboard =
    location.pathname === "/tutorial/dashboard" ||
    location.pathname === "/tutorial/dashboard/";

  const routeIsSrTutorial =
    location.pathname.startsWith("/tutorial") &&
    !onDocumentTutorialPath &&
    (location.pathname.startsWith("/tutorial/service-requests") ||
      onSrTutorialEntryDashboard ||
      srTutorialSession);

  const routeIsDocumentTutorial =
    location.pathname.startsWith("/tutorial") && !routeIsSrTutorial;

  const pathPrefix = location.pathname.startsWith("/tutorial") ? "/tutorial" : "/documents";

  return (
    <ServiceRequestTutorialProvider routeIsSrTutorial={routeIsSrTutorial}>
      <TutorialProvider
        routeIsTutorial={routeIsDocumentTutorial}
        onDocumentTutorialMarkedOnServer={refetchTutorialEligibility}
      >
        <div className="flex flex-col h-screen">
          <Navbar/>
          <NotificationPoller />
          <SidebarProvider className="flex-1 min-h-0">
            <AppSidebar pathPrefix={pathPrefix} />
            <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <Outlet context={mainContext} />
                </div>
            </SidebarInset>
            <ServiceRequestTutorialCoach />
            <TutorialCoach />
          </SidebarProvider>
        </div>
      </TutorialProvider>
    </ServiceRequestTutorialProvider>
  )
}
