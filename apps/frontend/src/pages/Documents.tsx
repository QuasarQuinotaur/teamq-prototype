import { AppSidebar } from "@/components/Sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import type { EmployeeWithContents } from "db";

export default function Documents() {

  const employee: EmployeeWithContents = {
    id: 0,
    firstName: "Theron",
    lastName: "Boozer",
    jobPosition: "Underwriter",
    dateOfBirth: new Date("1-2-20"),
    contents: [
      {
        id: 0,
        title: "Hello",
        link: "https://google.com",
        ownerName: "",
        jobPosition: "",
        contentType: "workflow",
        status: "",
        dateAdded: new Date("1-2-20"),
        dateUpdated: new Date("1-2-20"),
        expirationDate: new Date("1-2-20"),
        ownerId: 1
      },
      {
        id: 0,
        title: "World",
        link: "https://google.com",
        ownerName: "",
        jobPosition: "",
        contentType: "reference",
        status: "",
        dateAdded: new Date("1-2-20"),
        dateUpdated: new Date("1-2-20"),
        expirationDate: new Date("1-2-20"),
        ownerId: 1
      },
      {
        id: 0,
        title: "World",
        link: "https://google.com",
        ownerName: "",
        jobPosition: "",
        contentType: "tool",
        status: "",
        dateAdded: new Date("1-2-20"),
        dateUpdated: new Date("1-2-20"),
        expirationDate: new Date("1-2-20"),
        ownerId: 1
      }
    ]
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar employee={employee}/>
      <SidebarProvider className="flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <div className="flex flex-col flex-1 rounded-xl bg-muted/50 min-h-0 overflow-auto">
            <Outlet context={employee} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
