// main section of the sidebar

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible.tsx"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/elements/sidebar-elements.tsx"
import { CaretRightIcon } from "@phosphor-icons/react"
import { NavLink, useLocation } from "react-router-dom"

const sidebarNavActiveClasses =
    "data-active:bg-primary data-active:text-primary-foreground data-active:[&_svg]:text-primary-foreground hover:data-active:bg-primary/80 hover:data-active:text-primary-foreground"

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
  const location = useLocation()
  const hasSubItems = Boolean(item.items?.length)

  const routeInGroup =
      hasSubItems &&
      (location.pathname === item.url ||
          item.items!.some((s) => location.pathname === s.url))

  const [subOpen, setSubOpen] = React.useState(
      () => Boolean(item.isActive || routeInGroup),
  )

  React.useEffect(() => {
    if (routeInGroup) setSubOpen(true)
  }, [routeInGroup])

  return (
      <Collapsible
          asChild
          {...(hasSubItems
              ? { open: subOpen, onOpenChange: setSubOpen }
              : { defaultOpen: item.isActive })}
      >
        <SidebarMenuItem>
          <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={location.pathname === item.url}
              className={sidebarNavActiveClasses}
          >
            <NavLink to={item.url}>
              {item.icon}
              <span>{item.title}</span>
            </NavLink>
          </SidebarMenuButton>

          {hasSubItems ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90 peer-data-active/menu-button:text-primary-foreground">
                    <CaretRightIcon />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === subItem.url}
                              className={sidebarNavActiveClasses}
                          >
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
  )
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  return (
      <SidebarGroup>
        <SidebarMenu>
          {items.map((item) => (
              <NavMainRow key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroup>
  )
}