// Toolbar shows at the top of entry pages for querying

import * as React from "react";

import type {
    CardEntry
} from "@/components/cards/Card.tsx";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/NavigationMenu.tsx"
import { Separator } from "@/elements/separator.tsx"
import { ButtonGroup } from "@/elements/buttons/button-group.tsx";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import FilterButton from "@/components/paging/toolbar/FilterButton.tsx";
import SortButton from "@/components/paging/toolbar/SortButton.tsx";
import ViewSelectorButton, {type ViewType} from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import SearchBar, {type SearchBarProps} from "@/components/paging/toolbar/SearchBar.tsx";


type ToolbarProps = {
    view: ViewType;
    setView: (view: ViewType) => void;
    setWhitelistFilter: (key: string, whitelistFilter: ((entry: CardEntry) => boolean) | undefined) => void;
    extraElements?: React.ReactNode[];
} & SearchBarProps;
export default function Toolbar({
                                    view,
                                    setView,
                                    setFuseFilter,
                                    // setWhitelistFilter,
                                    extraElements
}: ToolbarProps) {
    const topRightElements = extraElements ? [...extraElements] : [];
    topRightElements.push(
        <FilterButton/>,
        <SortButton/>,
        <ViewSelectorButton view={view} setView={setView}/>
    )

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 w-full">
        <NavigationMenu className={"max-w-full"}>
            {/*Left Bar*/}
            <SidebarTrigger className="-ml-1" />
            <NavigationMenuList>
                <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]"/>
                <NavigationMenuItem>
                    <SearchBar
                        setFuseFilter={setFuseFilter}
                    />
                </NavigationMenuItem>
            </NavigationMenuList>
            <div className="flex-1"/>
            {/*Right Bar*/}
            <NavigationMenuList>
                <ButtonGroup className={"gap-1 overflow-hidden"}>
                    {/*Todo: Overflow Handling?*/}
                    {topRightElements.map((item) => {
                        // Make all elements in the top right
                        return (
                            <NavigationMenuItem>
                                {item}
                            </NavigationMenuItem>
                        )
                    })}
                </ButtonGroup>
            </NavigationMenuList>
        </NavigationMenu>
        </div>
        </header>
    )
}