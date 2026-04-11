// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {useCallback, useEffect, useMemo, useState} from "react";
import * as React from "react";

import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {type CardGridProps} from "@/components/cards/CardGrid.tsx";
import CardList, {type CardListProps} from "@/components/cards/CardList.tsx";
import {handleKeyChangeOrDelete} from "@/lib/utils.ts";
import Fuse from "fuse.js";
import type {ViewType} from "@/components/paging/toolbar/ViewSelectorButton.tsx";

export const FILTER_KEY_SEARCH = "SearchFilter";
export const FILTER_KEY_CONTENT_TYPE = "ContentTypeFilter";

// Props used for specifying entries. These are passed to card grid + list for info about active entries
export type EntryProps = {
    entries: CardEntry[];
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
}

type EntryPageProps = {
    cardGridProps: CardGridProps;
        // currently unused (uncomment if used in future)
        // cardListProps?: CardListProps;
    // These elements get added to top right toolbar
    extraToolbarElements?: React.ReactNode[];
    // Already set filters
    initWhitelistFilters?: {[key: string]: (entry: CardEntry) => boolean}
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

    // Store many different whitelist filters from multiple sources
    const [whitelistFilters, setWhitelistFilters] = useState(initWhitelistFilters ?? {})
    function setWhitelistFilter(key: string, whitelistFilter: ((entry: CardEntry) => boolean) | undefined) {
        handleKeyChangeOrDelete(
            whitelistFilters,
            setWhitelistFilters,
            key,
            whitelistFilter
        )
    }

    // Filter array using fuse fuzzy search
    const [fuseFilters, setFuseFilters] = useState<
        {[key: string]: (fuse: Fuse<CardEntry>) => CardEntry[]}
    >({})
    const fuse = useMemo(() => {
        return new Fuse(entries, {
            keys: ["title"],
            useExtendedSearch: true,
            useTokenSearch: true,

        })
    }, [entries])
    function setFuseFilter(
        key: string,
        fuseFilter: ((fuse: Fuse<CardEntry>) => CardEntry[]) | undefined
    ) {
        handleKeyChangeOrDelete(
            fuseFilters,
            setFuseFilters,
            key,
            fuseFilter
        )
    }

    // Returns all entries filtered
    const getFilteredEntries = useCallback(() => {
        const fuseFilterList = Object.values(fuseFilters)
        const fuseFiltered =
            fuseFilterList.length > 0 ? fuseFilterList.reduce(
                (acc: CardEntry[], filter) => {
                    const resultEntries = filter(fuse);
                    return [
                        ...acc,
                        ...resultEntries
                    ]
                }, []
            ) : entries
        return fuseFiltered.filter((entry: CardEntry): boolean => {
            // Only include entries in whitelist
            const notInWhitelist =
                Object.entries(whitelistFilters).some(([key, filter]) => {
                    return !filter(entry)
                })
            return !notInWhitelist;
        })
    }, [entries, fuse, fuseFilters, whitelistFilters]);


    useEffect(() => {
        setFilterEntries(getFilteredEntries)
    }, [getFilteredEntries]);


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

    return (
        <>
            {/*Toolbar for querying*/}
            <Toolbar
                view={view}
                setView={setView}
                extraElements={extraToolbarElements}
                setFuseFilter={setFuseFilter}
                setWhitelistFilter={setWhitelistFilter}
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