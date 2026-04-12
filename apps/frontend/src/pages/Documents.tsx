import { AppSidebar } from "@/components/sidebar/Sidebar.tsx"
import {
  SidebarInset,
  SidebarProvider,
} from "@/elements/sidebar-elements.tsx"
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useUserLink } from "@/hooks/useUserLink";

export default function Documents() {
  useUserLink();

  return (
    <div className="flex flex-col h-screen">
      <Navbar/>
      <SidebarProvider className="flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
            <Outlet/>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
