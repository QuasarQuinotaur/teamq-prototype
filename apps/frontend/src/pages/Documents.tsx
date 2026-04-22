import { AppSidebar } from "@/components/sidebar/Sidebar.tsx"
import {
  SidebarInset,
  SidebarProvider,
} from "@/elements/sidebar-elements.tsx"
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUserLink } from "@/hooks/useUserLink";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import NotificationPoller from "@/components/notifications/NotificationPoller.tsx";
import { useEffect } from "react";
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
  useUserLink();

  // Pass context down
  const mainContext = useMainContext();
  useApplySettings(mainContext.setTagsEnabled, mainContext.setView);

  return (
    <div className="flex flex-col h-screen">
      <Navbar/>
      <NotificationPoller />
      <SidebarProvider className="flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Outlet context={mainContext} />
            </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
