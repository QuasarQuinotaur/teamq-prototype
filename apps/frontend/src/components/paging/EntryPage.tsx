// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {useCallback, useState} from "react";
import * as React from "react";

import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {CARD_GRID_LAYOUT_CLASS, type CardGridProps} from "@/components/cards/CardGrid.tsx";
import ContentCardSkeleton from "@/components/cards/ContentCardSkeleton.tsx";
import CardList from "@/components/cards/CardList.tsx";
import type {ViewSelectorButtonProps} from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import type { CreateColumnsOptions } from "@/components/cards/list-view-table/columns.tsx";

// Props used for specifying entries. These are passed to card grid + list for info about active entries
export type EntryProps = {
    entries: CardEntry[];
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
    listColumnOptions?: CreateColumnsOptions;
}

// T describes type of fields for filtering, ContentFields for Content, EmployeeFields for Employee, etc.
type EntryPageProps<T> = {
    cardGridProps: CardGridProps;
    /** When set, list view rows open the item (e.g. document viewer) on click. */
    onListRowClick?: (entry: CardEntry) => void;
    /** These elements get added to top right toolbar. */
    extraToolbarElements?: React.ReactNode[];
    queryProps: QueryProps<T>;
    /** When set alongside an empty `entries` list, grid view shows this many skeleton cards instead of the grid. */
    gridSkeletonCount?: number | null;
    /** If specified, will list entries that are favorited to show in a special category*/
    favoritedEntries?: CardEntry[];
    /** When set, shows “N …” above the grid (and list), e.g. documents or employees. */
    displayedEntryLabels?: { one: string; other: string };
    /** When true, shows a Favorites block above the main list (documents UI). */
    showFavoritesSection?: boolean;
}
export default function EntryPage<T extends object>({
                                                        cardGridProps,
                                                        onListRowClick,
                                                        extraToolbarElements,
                                                        queryProps,
                                                        gridSkeletonCount,
                                                        favoritedEntries,
                                                        displayedEntryLabels,
                                                        showFavoritesSection = false,
                                                        ...entryProps
}: EntryPageProps<T> & EntryProps) {
    const { entries, createOptionsElement, listColumnOptions } = entryProps;

    const resultCountLine =
        displayedEntryLabels != null ? (
            <p
                className="px-10 text-sm text-muted-foreground"
                aria-live="polite"
            >
                {entries.length === 1
                    ? `1 ${displayedEntryLabels.one}`
                    : `${entries.length} ${displayedEntryLabels.other}`}
            </p>
        ) : null;

    const favoritesHeadingClass =
        "px-10 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase";

    // Pagination
    const entriesPerPage = 10;
    const [pageEntries, setPageEntries] = useState<CardEntry[]>()
    const [pageNum, setPageNum] = useState<number>(1);
    const updatePageEntries = useCallback((viewPageNum: number) => {
        const first = entriesPerPage*(viewPageNum-1)
        const last = entriesPerPage*(viewPageNum)
        setPageEntries(entries.slice(first, last))
    }, [entries])

    // for view type (grid vs. list)
    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid
    const { view, setView } = useMainContext()
    const viewSelectorButtonProps: ViewSelectorButtonProps = {
        view, setView
    }

    function createCardGrid(gridEntries: CardEntry[]) {
        return (
            <CardGrid
                {...cardGridProps}
                {...entryProps}
                entries={gridEntries}
                isLoading={gridSkeletonCount != null && gridSkeletonCount > 0}
            />
        )
    }

    function createCardList(listEntries: CardEntry[]) {
        return (
            <CardList
                {...listEntries}
                {...entryProps}
                entries={listEntries}
                onRowClick={onListRowClick}
                listColumnOptions={listColumnOptions}
            />
        )
    }

    return (
        <div className={"bg-muted/50 flex flex-col flex-1 rounded-xl min-h-0 overflow-auto pt-2"}>
            {/*Toolbar for querying*/}
            <Toolbar
                extraElements={extraToolbarElements}
                viewSelectorButtonProps={viewSelectorButtonProps}
                queryProps={queryProps}
            />
            <div className="flex flex-col flex-1 rounded-xl min-h-0 overflow-auto pt-2 pb-8">
                {gridSkeletonCount != null && gridSkeletonCount > 0 && entries.length === 0 ? (
                    <div
                        className={CARD_GRID_LAYOUT_CLASS}
                        aria-busy="true"
                        aria-label="Loading documents"
                    >
                        {Array.from({ length: gridSkeletonCount }, (_, i) => (
                            <ContentCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (view === "Grid" ? (
                    showFavoritesSection ? (
                        <div className="flex flex-col gap-8">
                            <section className="flex flex-col gap-2">
                                <h2 className={favoritesHeadingClass}>Favorites</h2>
                                {createCardGrid(favoritedEntries ?? [])}
                            </section>
                            <section className="flex flex-col gap-2">
                                <h2 className={favoritesHeadingClass}>All documents</h2>
                                {resultCountLine}
                                {createCardGrid(entries)}
                            </section>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {resultCountLine}
                            {createCardGrid(entries)}
                        </div>
                    )
                ) : (
                    showFavoritesSection ? (
                        <>
                            <section className="flex flex-col gap-2 pb-6">
                                <h2 className={favoritesHeadingClass}>Favorites</h2>
                                {createCardList(favoritedEntries ?? [])}
                            </section>
                            <section className="flex flex-col gap-2">
                                <h2 className={favoritesHeadingClass}>All documents</h2>
                                {resultCountLine}
                                {createCardList(pageEntries)}
                                <div>
                                    <Pagination
                                        docNum={entries.length}
                                        docsPerPage={entriesPerPage}
                                        pageNum={pageNum}
                                        setPageNum={setPageNum}
                                        updatePageEntries={updatePageEntries}
                                    />
                                </div>
                            </section>
                        </>
                    ) : (
                        <>
                            {resultCountLine}
                            {createCardList(pageEntries)}
                            <div>
                                <Pagination
                                    docNum={entries.length}
                                    docsPerPage={entriesPerPage}
                                    pageNum={pageNum}
                                    setPageNum={setPageNum}
                                    updatePageEntries={updatePageEntries}
                                />
                            </div>
                        </>
                    )
                ))}
            </div>
        </div>
    )
}