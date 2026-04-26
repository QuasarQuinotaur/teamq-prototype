"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/NavMain.tsx"
//import { NavSecondary } from "@/components/ui/nav-secondary"
//import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/elements/sidebar-elements.tsx"
import {ChartBarIcon, ClockIcon, PersonIcon, FilesIcon, ListBulletsIcon} from "@phosphor-icons/react"
import {Button} from "@/elements/buttons/button.tsx";
import {InboxIcon} from "lucide-react";
import { useEffect, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom";
import useJobNameMap from "@/hooks/useJobNameMap"
import useGetEmployeeIsAdmin from "@/hooks/useGetEmployeeIsAdmin"
import type { Employee } from "db"

const data = {
  // user: {
  //   name: "shadcn",
  //   email: "m@example.com",
  //   avatar: "/avatars/shadcn.jpg",
  // },
  navMain: [
    {
      title: "Dashboard",
      url: "/documents/dashboard",
      icon: (
        <ChartBarIcon/>
      ),
      isActive: true,
    },
    {
      title: "Recent",
      url: "/documents/recent", // not sure, needs sort the documents by most recently accessed
      icon: (
        <ClockIcon/>
      ),
    },
    // {
    //   title: "Favorited",
    //   url: "/documents/favorited", // not sure, needs only display the documents bookmarked by the user
    //   icon: (
    //     <StarIcon/>
    //   ),
    // },
    {
      title: "Service requests",
      url: "/documents/service-requests",
      icon: (
        <ListBulletsIcon/>
      ),
    },
  ],
  // navSecondary: [
  //   {
  //     title: "Support",
  //     url: "#",
  //     icon: (
  //       <LifebuoyIcon
  //       />
  //     ),
  //   },
  //   {
  //     title: "Feedback",
  //     url: "#",
  //     icon: (
  //       <PaperPlaneTiltIcon
  //       />
  //     ),
  //   },
  // ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: (
  //       <CropIcon
  //       />
  //     ),
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: (
  //       <ChartPieIcon
  //       />
  //     ),
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: (
  //       <MapTrifoldIcon
  //       />
  //     ),
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const [employee, setEmployee] = useState<Employee | null>(null);
  const { jobNameMap, rolesLoading } = useJobNameMap();
  const { getEmployeeIsAdmin } = useGetEmployeeIsAdmin();
  const otherRolesItems = React.useMemo(() => {
        const notOfRole = Object.entries(jobNameMap).filter(([id]) => {
            return id !== employee?.jobPosition
        })
        if (notOfRole.length === 0) {
            return null
        }
        return notOfRole.map(([id, name]) => {
            return { title: name, url: `/documents/role/${id}` }
        })
  }, [jobNameMap])

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {
                  withCredentials: true,
                });
                setEmployee(response.data);
            } catch (error) {
                console.error("Not logged in or no employee record found", error);
            }
        };
        fetchUser();
    }, []);

    const allDocumentsItem = {
      title: "Content",
      url: "/documents/all",
      icon: (<FilesIcon/>),
      isActive: true,
      items: [
        { title: "My content", url: "/documents/my-documents" },
        { title: "Checked out", url: "/documents/checked-out" },
        ...((employee && getEmployeeIsAdmin(employee))
          ? [{ title: "Check in", url: "/documents/admin-check-in" }]
          : []),
        ...(employee?.jobPosition
          ? [{ title: "My role", url: `/documents/role/${employee.jobPosition}` }]
          : []),
        ...(!rolesLoading
          ? [{ title: "Other roles", url: "/documents/all", items: otherRolesItems }]
          : []),
        {
          title: "Document type",
          url: "/documents/all",
          items: [
            { title: "Workflow", url: "/documents/workflow" },
            { title: "Reference", url: "/documents/reference" },
            { title: "Tools", url: "/documents/tools" },
          ],
        },
      ],
    };

    const navItems = [
      ...data.navMain,
      allDocumentsItem,
      ...((employee && getEmployeeIsAdmin(employee)) ? [{
        title: "Employees",
        url: "/documents/employees",
        icon: (
            <PersonIcon/>
        )
      }] : [])
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        {/*<SidebarMenu>*/}
        {/*  <SidebarMenuItem>*/}
        {/*    <SidebarMenuButton size="lg" asChild>*/}
        {/*      <a href="#">*/}
        {/*        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">*/}
        {/*          <CommandIcon className="size-4" />*/}
        {/*        </div>*/}
        {/*        <div className="grid flex-1 text-left text-sm leading-tight">*/}
        {/*          <span className="truncate font-medium">Acme Inc</span>*/}
        {/*          <span className="truncate text-xs">Enterprise</span>*/}
        {/*        </div>*/}
        {/*      </a>*/}
        {/*    </SidebarMenuButton>*/}
        {/*  </SidebarMenuItem>*/}
        {/*</SidebarMenu>*/}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {/*<NavProjects projects={data.projects} />*/}
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
        {/* NOTE: NavSecondary.tsx is commented out bc it's not needed but could be implemented in the future if we want another section on the sidebar
        nav-projects.tsx was deleted bc it is not useful for our sidebar, but it can be redownloaded from shadcn sidebar-08 */}
      </SidebarContent>
      <SidebarFooter>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2"
        >
          <Link to="/documents/notifications">
            <InboxIcon />
            <span className="group-data-[collapsible=icon]:sr-only">Inbox</span>
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
