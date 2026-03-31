"use client"

import * as React from "react"

import { NavMain } from "@/components/ui/nav-main"
import { NavTools } from "@/components/ui/nav-tools"
import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { RowsIcon, WaveformIcon, CommandIcon, TerminalIcon, BookOpenIcon, BellIcon, ChartPieIcon } from "@phosphor-icons/react"

// This is sample data.
const data = {
  user: {
    name: "hanover",
    email: "test@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Hanover Insurance",
      logo: (
        <RowsIcon
        />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <WaveformIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <CommandIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Easy Access",
      url: "#",
      icon: (
        <TerminalIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Recent",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
      ],
    },
    {
      title: "Workflow Content",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Category 1",
          url: "#",
        },
        {
          title: "Category 2",
          url: "#",
        },
        {
          title: "Category 3",
          url: "#",
        },
      ],
    },
    {
      title: "Reference Content",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Category 1",
          url: "#",
        },
        {
          title: "Category 2",
          url: "#",
        },
        {
          title: "Category 3",
          url: "#",
        },
      ],
    },
  ],
  tools: [
    {
      name: "Dashboard",
      url: "#",
      icon: (
        <ChartPieIcon
        />
      ),
    },
    {
      name: "Notifications",
      url: "#",
      icon: (
        <BellIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
       TO-DO: put logo here
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavTools tools={data.tools} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
