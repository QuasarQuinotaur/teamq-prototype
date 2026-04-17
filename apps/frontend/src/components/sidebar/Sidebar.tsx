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
    {
      title: "All documents",
      url: "/documents/all",
      icon: (
        <FilesIcon/>
      ),
      isActive: true,
      items: [
        { title: "Workflow", url: "/documents/workflow" },
        { title: "Reference", url: "/documents/reference" },
        { title: "Tools", url: "/documents/tools" },
      ],
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

  const [employee, setEmployee] = useState<{ jobPosition: string } | null>(null);

    const api = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
        withCredentials: true,
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/me');
                setEmployee(response.data);
            } catch (error) {
                console.error("Not logged in or no employee record found", error);
            }
        };
        fetchUser();
    }, []);

    const navItems = [
      ...data.navMain,
      ...(employee?.jobPosition === 'admin' ? [{
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
          variant="outline"
          size="lg"
          type="button"
          className="w-full group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-2"
        >
          <InboxIcon />
          <span className="group-data-[collapsible=icon]:sr-only">Inbox</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
