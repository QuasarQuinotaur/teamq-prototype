"use client"

import * as React from "react"

import { NavMain } from "@/components/ui/nav-main"
//import { NavSecondary } from "@/components/ui/nav-secondary"
//import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ChartBarIcon, ClockIcon, BookOpenIcon, PenIcon, WrenchIcon, StarIcon } from "@phosphor-icons/react"
import {Button} from "@/components/ui/button.tsx";
import { ButtonWithIcon} from "@/components/ui/inbox-button.tsx";

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
      url: "/dashboard/recent", // not sure, needs sort the documents by most recently accessed
      icon: (
        <ClockIcon/>
      ),
    },
    {
      title: "Bookmarked",
      url: "/dashboard/bookmarked", // not sure, needs only display the documents bookmarked by the user
      icon: (
        <StarIcon/>
      ),
    },
    {
      title: "Workflow",
      url: "/dashboard/workflow",
      icon: (
        <PenIcon/>
      ),
    },
    {
      title: "Reference",
      url: "/documents/reference",
      icon: (
          <BookOpenIcon />
      ),
    },
    {
      title: "Tools",
      url: "/documents/tools",
      icon: (
          <WrenchIcon/>
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
  return (
    <Sidebar variant="inset" {...props}>
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
        <NavMain items={data.navMain} />
        {/*<NavProjects projects={data.projects} />*/}
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
        {/* NOTE: nav-secondary.tsx is commented out bc it's not needed but could be implemented in the future if we want another section on the sidebar
        nav-projects.tsx was deleted bc it is not useful for our sidebar, but it can be redownloaded from shadcn sidebar-08 */}
      </SidebarContent>
      <SidebarFooter>
        <ButtonWithIcon/>
      </SidebarFooter>
    </Sidebar>
  )
}
