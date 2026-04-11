// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {useEffect, useState} from "react";
import * as React from "react";

import Toolbar, {type ViewType} from "@/components/paging/toolbar/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {type CardGridProps} from "@/components/cards/CardGrid.tsx";
import CardList, {type CardListProps} from "@/components/cards/CardList.tsx";
import {handleKeyChange} from "@/lib/utils.ts";

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
    const { entries, } = entryProps;

    // for view type (grid vs. list)
    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid
    const [view, setView] = useState<ViewType>("Grid");

    // Store entries to filter them before passing
    const [filterEntries, setFilterEntries] = useState(entries);

    // Store many different whitelist filters from multiple sources
    const [whitelistFilters, setWhitelistFilters] = useState(initWhitelistFilters ?? {})

    // Sets whitelist filter at a key
    function setWhitelistFilter(key: string, whitelistFilter: (entry: CardEntry) => boolean | undefined) {
        if (whitelistFilter === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [key]: _, ...withoutKey } = whitelistFilters;
            setWhitelistFilters(withoutKey);
        } else {
            handleKeyChange(setWhitelistFilters, key, whitelistFilter);
        }
    }

    // Updates entries to filter using whitelistFilters on update
    useEffect(() => {
        const filterEntries = Object.entries(whitelistFilters)
        setFilterEntries(entries.filter(
            (entry) => {
                // Only include entries in whitelist
                // console.log("UPDATE FILTER:", whitelistFilters);
                const notInWhitelist =
                    filterEntries.some(([key, filter]) => {
                        return !filter(entry)
                    })
                return !notInWhitelist;
            }
        ))
    }, [whitelistFilters, entries]);


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