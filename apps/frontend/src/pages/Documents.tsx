import { AppSidebar } from "@/components/Sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function Documents() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar/>
      <SidebarProvider className="flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <div className="flex flex-col flex-1 rounded-xl bg-muted/50 min-h-0 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
