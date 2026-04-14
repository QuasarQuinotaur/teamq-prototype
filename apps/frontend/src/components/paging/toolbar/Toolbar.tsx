// Toolbar shows at the top of entry pages for querying

import * as React from "react";

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/NavigationMenu.tsx"
import { Separator } from "@/elements/separator.tsx"
import { ButtonGroup } from "@/elements/buttons/button-group.tsx";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import FilterButton, {type FilterButtonProps} from "@/components/paging/toolbar/FilterButton.tsx";
import SortButton, {type SortButtonProps} from "@/components/paging/toolbar/SortButton.tsx";
import ViewSelectorButton, {type ViewSelectorButtonProps} from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import SearchBar, {type SearchBarProps} from "@/components/paging/toolbar/SearchBar.tsx";

export type QueryProps<T> = {
    searchBarProps?: SearchBarProps,
    filterButtonProps?: FilterButtonProps<T>,
    sortButtonProps?: SortButtonProps,
}

type ToolbarProps<T> = {
    queryProps: QueryProps<T>;
    viewSelectorButtonProps: ViewSelectorButtonProps;
    extraElements?: React.ReactNode[];
};
export default function Toolbar<T extends object>({
                                                      queryProps,
                                                      viewSelectorButtonProps,
                                                      extraElements,
}: ToolbarProps<T>) {
    const topRightElements = extraElements ? [...extraElements] : [];
    topRightElements.push(
        queryProps.filterButtonProps && <FilterButton {...queryProps.filterButtonProps} />,
        queryProps.sortButtonProps && <SortButton {...queryProps.sortButtonProps} />,
        <ViewSelectorButton {...viewSelectorButtonProps} />,
    )

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 w-full">
                <NavigationMenu className={"max-w-full"}>
                    {/*Sidebar Trigger Button*/}
                    <>
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]"/>
                    </>
                    {/*Left Bar*/}
                    <NavigationMenuList>
                        {queryProps.searchBarProps && (
                            <NavigationMenuItem className={"flex flex-col gap-2"}>
                                <SearchBar {...queryProps.searchBarProps}/>
                            </NavigationMenuItem>
                        )}
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