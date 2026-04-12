// main section of the sidebar

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible.tsx"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/elements/sidebar-elements.tsx"
import { CaretRightIcon } from "@phosphor-icons/react"
import { NavLink, useLocation } from "react-router-dom";

export type NavMainItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

function NavMainRow({ item }: { item: NavMainItem }) {
  const location = useLocation();
  const hasSubItems = Boolean(item.items?.length);
  const routeInGroup =
    hasSubItems &&
    (location.pathname === item.url ||
      item.items!.some((s) => location.pathname === s.url));

  const [subOpen, setSubOpen] = React.useState(
    () => Boolean(item.isActive || routeInGroup),
  );

  React.useEffect(() => {
    if (routeInGroup) setSubOpen(true);
  }, [routeInGroup]);

  const collapsibleProps = hasSubItems
    ? { open: subOpen, onOpenChange: setSubOpen }
    : { defaultOpen: item.isActive };

  return (
    <Collapsible asChild {...collapsibleProps}>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={item.title}>
          <NavLink to={item.url}>
            {item.icon}
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
        {hasSubItems ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90">
                <CaretRightIcon />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items!.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild>
                      <NavLink to={subItem.url}>
                        <span>{subItem.title}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  return (
    <SidebarGroup>
      {/*<SidebarGroupLabel>Platform</SidebarGroupLabel>*/}
      <SidebarMenu>
        {items.map((item) => (
          <NavMainRow key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
