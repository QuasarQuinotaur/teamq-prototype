// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {useEffect, useState} from "react";
import * as React from "react";

import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {type CardGridProps} from "@/components/cards/CardGrid.tsx";
import CardList, {type CardListProps} from "@/components/cards/CardList.tsx";
import Fuse from "fuse.js";
import type {ViewSelectorButtonProps, ViewType} from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import useEntryPageFilter from "@/components/forms/entry-page-filter.tsx";

export const FILTER_KEY_SEARCH = "SearchFilter";
export const FILTER_KEY_CONTENT_TYPE = "ContentTypeFilter";

// Props used for specifying entries. These are passed to card grid + list for info about active entries
export type EntryProps = {
    entries: CardEntry[];
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
}
export type FuseFilter = (fuse: Fuse<CardEntry>) => CardEntry[]
export type FuseFilters = {[key: string]: FuseFilter}
export type WhitelistFilter = (entry: CardEntry) => boolean
export type WhitelistFilters = {[key: string]: WhitelistFilter}

type EntryPageProps = {
    cardGridProps: CardGridProps;
        // currently unused (uncomment if used in future)
        // cardListProps?: CardListProps;
    // These elements get added to top right toolbar
    extraToolbarElements?: React.ReactNode[];
    // Already set filters
    initWhitelistFilters?: WhitelistFilters
}
export default function EntryPage({
                                      // cardListProps,
                                      cardGridProps,
                                      extraToolbarElements,
                                      initWhitelistFilters,
                                      ...entryProps
}: EntryPageProps & EntryProps) {
    const { entries } = entryProps;

    // for view type (grid vs. list)
    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid
    const [view, setView] = useState<ViewType>("Grid");

    // Store entries to filter them before passing
    const [filterEntries, setFilterEntries] = useState(entries);


    // Pagination
    const [pageEntries, setPageEntries] = useState<CardEntry[]>()
    const entriesPerPage = 10;

    const pagedEntries: EntryProps = { entries: pageEntries, createOptionsElement: entryProps.createOptionsElement }

    useEffect(() => {
        setPageEntries(filterEntries.slice(0, entriesPerPage))
    }, [filterEntries]);

    const pageCallback = (pageNum: number)=> {
        const first = entriesPerPage*(pageNum-1)
        const last = entriesPerPage*(pageNum)
        setPageEntries(filterEntries.slice(first, last))
    }

    // Props
    const useProps = useEntryPageFilter({
        entries, initWhitelistFilters, setFilterEntries
    })
    const viewSelectorButtonProps: ViewSelectorButtonProps = {
        view, setView
    }

    return (
        <>
            {/*Toolbar for querying*/}
            <Toolbar
                extraElements={extraToolbarElements}
                searchBarProps={useProps.searchBarProps}
                filterButtonProps={useProps.filterButtonProps}
                sortButtonProps={useProps.sortButtonProps}
                viewSelectorButtonProps={viewSelectorButtonProps}
            />
            {view === "Grid" ?
                (
                    <CardGrid
                        {...cardGridProps}
                        {...entryProps}
                        entries={filterEntries}
                    />
                ) :
                (
                    <>
                        <CardList
                            {...pageEntries}
                            {...pagedEntries}
                        />
                        <div>
                            <Pagination docNum={filterEntries.length} entriesCallback={pageCallback} />
                        </div>
                    </>
                )}
        </>
    )
}