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

export default function Documents() {
  useUserLink();

  // Pass context down
  const mainContext = useMainContext()

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
