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
import { cn } from "@/lib/utils.ts";

export type QueryProps<T> = {
    searchBarProps?: SearchBarProps,
    filterButtonProps?: FilterButtonProps<T>,
    sortButtonProps?: SortButtonProps,
}

type ToolbarProps<T> = {
    queryProps: QueryProps<T>;
    viewSelectorButtonProps: ViewSelectorButtonProps;
    extraElements?: React.ReactNode[];
    /** When false, grid/list toggle is hidden (e.g. embedded grids in split view). */
    showViewSelector?: boolean;
    /** Optional content after the search bar (e.g. Cancel in multi-select mode). */
    toolbarLeadingSlot?: React.ReactNode;
    /** Horizontally centered in the toolbar (e.g. “N selected”). */
    toolbarCenterSlot?: React.ReactNode;
};
export default function Toolbar<T extends object>({
                                                      queryProps,
                                                      viewSelectorButtonProps,
                                                      extraElements,
                                                      showViewSelector = true,
                                                      toolbarLeadingSlot,
                                                      toolbarCenterSlot,
}: ToolbarProps<T>) {
    const topRightElements = extraElements ? [...extraElements] : [];
    topRightElements.push(
        queryProps.filterButtonProps && <FilterButton {...queryProps.filterButtonProps} />,
        queryProps.sortButtonProps && <SortButton {...queryProps.sortButtonProps} />,
    );
    if (showViewSelector) {
        topRightElements.push(<ViewSelectorButton {...viewSelectorButtonProps} />);
    }

    const hasToolbarCenter = Boolean(toolbarCenterSlot);

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 px-4">
                <NavigationMenu className="flex max-w-[min(100%,24rem)] flex-none shrink-0 items-center justify-start">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]"
                    />
                    <NavigationMenuList className="flex-none justify-start gap-2">
                        {queryProps.searchBarProps && (
                            <NavigationMenuItem className={"flex flex-col gap-2"}>
                                <SearchBar {...queryProps.searchBarProps}/>
                            </NavigationMenuItem>
                        )}
                    </NavigationMenuList>
                </NavigationMenu>
                {toolbarLeadingSlot ? (
                    <div className="flex shrink-0 items-center gap-2">{toolbarLeadingSlot}</div>
                ) : null}
                {hasToolbarCenter ? (
                    <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-2">
                        {toolbarCenterSlot}
                    </div>
                ) : null}
                <NavigationMenu
                    className={cn("shrink-0", !hasToolbarCenter && "ml-auto")}
                >
                    <NavigationMenuList>
                        <ButtonGroup className={"gap-1 overflow-hidden"}>
                            {topRightElements.map((item, i) => (
                                <NavigationMenuItem key={i}>
                                    {item}
                                </NavigationMenuItem>
                            ))}
                        </ButtonGroup>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </header>
    )
}
