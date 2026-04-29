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
  useSidebar,
} from "@/elements/sidebar-elements.tsx"
import { CaretRightIcon } from "@phosphor-icons/react"
import { NavLink, useLocation } from "react-router-dom"

const sidebarNavActiveClasses =
    "data-active:bg-primary data-active:text-primary-foreground data-active:[&_svg]:text-primary-foreground hover:data-active:bg-primary/80 hover:data-active:text-primary-foreground"

export type NavSubItem = {
  title: string
  url: string
  /** When set, this sub-item renders as a nested collapsible group. */
  items?: { title: string; url: string }[]
}

export type NavMainItem = {
  title: string
  url: string
  icon: React.ReactNode
  id?: string
  isActive?: boolean
  items?: NavSubItem[]
}

/** A collapsible group header inside a SidebarMenuSub (third level). */
function NavSubGroup({
  subItem,
  location,
}: {
  subItem: NavSubItem & { items: { title: string; url: string }[] }
  location: ReturnType<typeof useLocation>
}) {
  const activeInGroup = subItem.items.some((s) => location.pathname === s.url)
  const [open, setOpen] = React.useState(activeInGroup)

  React.useEffect(() => {
    if (activeInGroup) setOpen(true)
  }, [activeInGroup])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            isActive={false}
            className={`${sidebarNavActiveClasses} w-full justify-between pr-1`}
          >
            <span>{subItem.title}</span>
            <CaretRightIcon
              className="ml-auto shrink-0 transition-transform duration-200 data-[state=open]:rotate-90"
              data-state={open ? "open" : "closed"}
            />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="ml-2">
            {subItem.items.map((leaf) => (
              <SidebarMenuSubItem key={leaf.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={location.pathname === leaf.url}
                  className={sidebarNavActiveClasses}
                >
                  <NavLink to={leaf.url}>
                    <span>{leaf.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

function NavMainRow({ item }: { item: NavMainItem }) {
  const location = useLocation()
  const { state } = useSidebar()
  const hasSubItems = Boolean(item.items?.length)

  const routeInGroup =
      hasSubItems &&
      (location.pathname === item.url ||
          item.items!.some((s) =>
              s.items
                  ? s.items.some((l) => location.pathname === l.url)
                  : location.pathname === s.url,
          ))

  const [subOpen, setSubOpen] = React.useState(
      () => Boolean(item.isActive || routeInGroup),
  )

  React.useEffect(() => {
    if (state === "collapsed") {
      setSubOpen(false)
    } else if (routeInGroup) {
      setSubOpen(true)
    }
  }, [state, routeInGroup])

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
              id={item.id ?? null}
          >
            <NavLink to={item.url}>
              {item.icon}
              <span>{item.title}</span>
            </NavLink>
          </SidebarMenuButton>

          {hasSubItems ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90 peer-data-active/menu-button:text-primary-foreground peer-data-active/menu-button:hover:bg-black/20 peer-data-active/menu-button:hover:text-primary-foreground">
                    <CaretRightIcon />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((subItem) =>
                      subItem.items ? (
                        <NavSubGroup
                          key={subItem.title}
                          subItem={subItem as NavSubItem & { items: { title: string; url: string }[] }}
                          location={location}
                        />
                      ) : (
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
                      )
                    )}
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