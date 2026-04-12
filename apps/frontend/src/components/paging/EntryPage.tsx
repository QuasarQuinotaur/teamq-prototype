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
import type {ViewSelectorButtonProps, ViewType} from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";

export const FILTER_KEY_SEARCH = "SearchFilter";

// Props used for specifying entries. These are passed to card grid + list for info about active entries
export type EntryProps = {
    entries: CardEntry[];
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
}

// T describes type of fields for filtering, ContentFields for Content, EmployeeFields for Employee, etc.
type EntryPageProps<T> = {
    cardGridProps: CardGridProps;
        // currently unused (uncomment if used in future)
        // cardListProps?: CardListProps;
    // These elements get added to top right toolbar
    extraToolbarElements?: React.ReactNode[];
    queryProps: QueryProps<T>;
}
export default function EntryPage<T extends object>({
                                      // cardListProps,
                                      cardGridProps,
                                      extraToolbarElements,
                                      queryProps,
                                      ...entryProps
}: EntryPageProps<T> & EntryProps) {
    const { entries } = entryProps;

    // Pagination
    const [pageEntries, setPageEntries] = useState<CardEntry[]>()
    const entriesPerPage = 10;

    const pagedEntries: EntryProps = { entries: pageEntries, createOptionsElement: entryProps.createOptionsElement }

    useEffect(() => {
        setPageEntries(entries.slice(0, entriesPerPage))
    }, [entries]);

    const pageCallback = (pageNum: number)=> {
        const first = entriesPerPage*(pageNum-1)
        const last = entriesPerPage*(pageNum)
        setPageEntries(entries.slice(first, last))
    }

    // for view type (grid vs. list)
    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid
    const [view, setView] = useState<ViewType>("Grid");
    const viewSelectorButtonProps: ViewSelectorButtonProps = {
        view, setView
    }

    return (
        <>
            {/*Toolbar for querying*/}
            <Toolbar
                extraElements={extraToolbarElements}
                viewSelectorButtonProps={viewSelectorButtonProps}
                queryProps={queryProps}
            />
            {view === "Grid" ?
                (
                    <CardGrid
                        {...cardGridProps}
                        {...entryProps}
                        entries={entries}
                    />
                ) :
                (
                    <>
                        <CardList
                            {...pageEntries}
                            {...pagedEntries}
                        />
                        <div>
                            <Pagination docNum={entries.length} entriesCallback={pageCallback} />
                        </div>
                    </>
                )}
        </>
    )
}