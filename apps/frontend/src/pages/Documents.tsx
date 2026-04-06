import { AppSidebar } from "@/components/Sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

// id          Int       @id @default(autoincrement())
//   firstName   String
//   lastName    String
//   dateOfBirth DateTime
//   jobPosition String
//   contents    Content[]

//   createdRequests  ServiceRequest[] @relation("CreatedRequests")
//   assignedRequests ServiceRequest[] @relation("AssignedRequests")

export default function Documents() {

  const user = {
    id: 0,
    firstName: "Theron",
    lastName: "Boozer",
    jobPosition: "Underwriter",
    contents: []
  }

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
