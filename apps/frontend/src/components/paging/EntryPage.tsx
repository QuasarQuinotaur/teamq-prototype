// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {useEffect, useState} from "react";
import * as React from "react";

import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {CARD_GRID_LAYOUT_CLASS, type CardGridProps} from "@/components/cards/CardGrid.tsx";
import ContentCardSkeleton from "@/components/cards/ContentCardSkeleton.tsx";
import CardList from "@/components/cards/CardList.tsx";
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
    /** When set, list view rows open the item (e.g. document viewer) on click. */
    onListRowClick?: (entry: CardEntry) => void;
    // These elements get added to top right toolbar
    extraToolbarElements?: React.ReactNode[];
    queryProps: QueryProps<T>;
    /** When set alongside an empty `entries` list, grid view shows this many skeleton cards instead of the grid. */
    gridSkeletonCount?: number | null;
}
export default function EntryPage<T extends object>({
                                      cardGridProps,
                                      onListRowClick,
                                      extraToolbarElements,
                                      queryProps,
                                      gridSkeletonCount,
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
        <div className={"bg-muted/50 flex flex-col flex-1 rounded-xl min-h-0 overflow-auto pt-2"}>
            {/*Toolbar for querying*/}
            <Toolbar
                extraElements={extraToolbarElements}
                viewSelectorButtonProps={viewSelectorButtonProps}
                queryProps={queryProps}
            />
            <div className="flex flex-col flex-1 rounded-xl min-h-0 overflow-auto pt-2">
            {view === "Grid" ?
                (
                    gridSkeletonCount != null && gridSkeletonCount > 0 && entries.length === 0 ? (
                        <div
                            className={CARD_GRID_LAYOUT_CLASS}
                            aria-busy="true"
                            aria-label="Loading documents"
                        >
                            {Array.from({ length: gridSkeletonCount }, (_, i) => (
                                <ContentCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <CardGrid
                            {...cardGridProps}
                            {...entryProps}
                            entries={entries}
                        />
                    )
                ) :
                (
                    <>
                        <CardList
                            {...pageEntries}
                            {...pagedEntries}
                            onRowClick={onListRowClick}
                        />
                        <div>
                            <Pagination docNum={entries.length} entriesCallback={pageCallback} />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}