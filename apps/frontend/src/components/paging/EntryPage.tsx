/* eslint-disable react-hooks/preserve-manual-memoization -- entries array from parent each render */
// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {type ChangeEvent, useCallback, useMemo, useState} from "react";
import * as React from "react";
import { ChevronDown } from "lucide-react";

import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import { ThumbnailBatchProvider } from "@/components/cards/ThumbnailBatchContext.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {CARD_GRID_LAYOUT_CLASS, type CardGridProps} from "@/components/cards/CardGrid.tsx";
import ContentCardSkeleton from "@/components/cards/ContentCardSkeleton.tsx";
import CardList from "@/components/cards/CardList.tsx";
import CardListSkeleton from "@/components/cards/CardListSkeleton.tsx";
import SelectMarqueeLayer from "@/components/paging/SelectMarqueeLayer.tsx";
import type {ViewSelectorButtonProps} from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import type { CreateColumnsOptions } from "@/components/cards/list-view-table/columns.tsx";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/elements/input.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";

// Props used for specifying entries. These are passed to card grid + list for info about active entries
export type EntryProps = {
    entries: CardEntry[];
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
    listColumnOptions?: CreateColumnsOptions;
    /** When true, cards/list rows support multi-select for bulk actions. */
    selectMode?: boolean;
    isEntrySelected?: (entry: CardEntry) => boolean;
    onToggleEntrySelect?: (entry: CardEntry) => void;
    /** With `selectMode`, drag a rectangle over entries marked with `data-marquee-entry-id`. */
    onMarqueeSelect?: (entryIds: number[]) => void;
    /** Prevents marquee selection (e.g. during a bulk action). */
    marqueeBlocked?: boolean;
    /** List view: right-click a row (outside interactive controls) to open the ⋯ menu for that entry. */
    onDocumentRowContextMenu?: (entry: CardEntry, e: React.MouseEvent) => void;
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
    /** When true, only the scrollable entry list/grid is rendered (parent supplies toolbar). */
    omitToolbar?: boolean;
    /** When true, grid view is always used (e.g. split-pane embeds). */
    forceGridView?: boolean;
    /** Extra classes on the scrollable content wrapper (e.g. tighter padding in split panes). */
    contentClassName?: string;
    /** List view only: rows per page before pagination. Defaults to 10 (9 when omitToolbar). */
    listEntriesPerPage?: number;
    /** Passed to Toolbar: content after search (e.g. Cancel in multi-select). */
    toolbarLeadingSlot?: React.ReactNode;
    /** Passed to Toolbar: centered content (e.g. selection count). */
    toolbarCenterSlot?: React.ReactNode;
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
                                                        omitToolbar = false,
                                                        forceGridView = false,
                                                        contentClassName,
                                                        listEntriesPerPage,
                                                        toolbarLeadingSlot,
                                                        toolbarCenterSlot,
                                                        ...entryProps
}: EntryPageProps<T> & EntryProps) {
    const {
        entries,
        listColumnOptions,
        selectMode,
        onMarqueeSelect,
        marqueeBlocked,
    } = entryProps;

    const [favoritesOpen, setFavoritesOpen] = useState(true);

    const favoritesHeading = useMemo(
        () => (
            <div className="flex items-center gap-1.5 px-10">
                <button
                    type="button"
                    onClick={() => setFavoritesOpen((o) => !o)}
                    className="flex items-center gap-1 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                    Favorites
                    <ChevronDown
                        className="size-3.5 transition-transform duration-200"
                        style={{ transform: favoritesOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                    />
                </button>
                <HelpHint>
                    Starred documents appear in this section first on page one. Click the
                    label to expand or collapse the block.
                </HelpHint>
            </div>
        ),
        [favoritesOpen],
    );

    const allDocumentsHeading = useMemo(
        () => (
            <div className="flex items-center gap-1.5 px-10 text-left">
                <h2 className="border-b-0 pb-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    All documents
                </h2>
                <HelpHint>
                    The rest of the documents in this view (after favorites). Results follow
                    your search, filters, and sort; in list view, pagination applies here.
                </HelpHint>
            </div>
        ),
        [],
    );

    const showFavoritesWithEntries =
        showFavoritesSection && (favoritedEntries?.length ?? 0) > 0;

    // for view type (grid vs. list)
    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid
    const { view: contextView, setView } = useMainContext()
    const view = forceGridView ? "Grid" : contextView
    const viewSelectorButtonProps: ViewSelectorButtonProps = {
        view, setView
    }

    // Pagination (list view)
    const [entriesPerPage, setEntriesPerPage] =
        useState(listEntriesPerPage ?? (omitToolbar ? 9 : 10));
    const [pageEntries, setPageEntries] = useState<CardEntry[]>()
    const [pageNum, setPageNum] = useState<number>(1);
    const [displayedPage, setDisplayedPage] = useState<number>(1);

    // When favorites are shown in list view, page 1 has fewer regular-item slots.
    const numFav =
        showFavoritesWithEntries && view === "List"
            ? (favoritedEntries?.length ?? 0)
            : 0;
    const slotsPage1 = Math.max(0, entriesPerPage - numFav);

    const updatePageEntries = useCallback((viewPageNum: number) => {
        setDisplayedPage(viewPageNum);
        let first: number;
        let last: number;
        if (viewPageNum === 1) {
            first = 0;
            last = slotsPage1;
        } else {
            first = slotsPage1 + entriesPerPage * (viewPageNum - 2);
            last = first + entriesPerPage;
        }
        setPageEntries(entries.slice(first, last));
    }, [entries, entriesPerPage, slotsPage1])

    function newNumEntries(numPerPage: ChangeEvent<HTMLInputElement, HTMLInputElement>) {
        setEntriesPerPage(+numPerPage.target.value)

    }

    const numEntriesInput = (
        <>
            <Input
                className="w-5 border-0 border-b rounded-none p-0 h-auto text-center text-muted-foreground"
                placeholder={String(entriesPerPage)}
                onChange={newNumEntries}
            />
        </>
    )

    const resultCountLine =
        displayedEntryLabels != null ? (
            <section className="flex px-10 flex-nowrap">
                {( view === "List" ? (
                    <>
                        {numEntriesInput}
                        <p
                        className="text-sm text-muted-foreground pl-1"
                        aria-live="polite"
                        >
                        of
                        {entries.length === 1
                            ? ` 1 ${displayedEntryLabels.one}`
                            : ` ${entries.length} ${displayedEntryLabels.other}`}
                        </p>
                    </>
                ) : (
                    <p
                        className="text-sm text-muted-foreground pl-1"
                        aria-live="polite"
                    >
                        {entries.length === 1
                            ? `1 ${displayedEntryLabels.one}`
                            : `${entries.length} ${displayedEntryLabels.other}`}
                    </p>
                ))}
            </section>
        ) : null;

    const gridExpectedIds = useMemo(() => entries.map((e) => e.item.id), [entries]);

    const gridBatchKey = useMemo(() => `grid-${gridExpectedIds.join(",")}`, [gridExpectedIds]);

    const favoritesExpectedIds = useMemo(
        () => (favoritedEntries ?? []).map((e) => e.item.id),
        [favoritedEntries],
    );

    const favoritesBatchKey = useMemo(
        () => `fav-${favoritesExpectedIds.join(",")}`,
        [favoritesExpectedIds],
    );

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
                {...entryProps}
                entries={listEntries}
                onRowClick={onListRowClick}
                listColumnOptions={listColumnOptions}
            />
        )
    }

    const marqueeCommit = onMarqueeSelect ?? (() => {});

    const entryScrollInner = (
                <>
                {gridSkeletonCount != null && gridSkeletonCount > 0 && entries.length === 0 ? (
                    view === "List" ? (
                        <CardListSkeleton rows={gridSkeletonCount} />
                    ) : (
                        <div
                            className={CARD_GRID_LAYOUT_CLASS}
                            aria-busy="true"
                            aria-label="Loading documents"
                        >
                            {Array.from({ length: gridSkeletonCount }, (_, i) => (
                                <ContentCardSkeleton key={i} />
                            ))}
                        </div>
                    )
                ) : (view === "Grid" ? (
                    showFavoritesWithEntries ? (
                        <div className="flex flex-col gap-8">
                            <section className="flex flex-col gap-2">
                                {favoritesHeading}
                                {favoritesOpen && (
                                    <ThumbnailBatchProvider
                                        batchKey={favoritesBatchKey}
                                        expectedContentIds={favoritesExpectedIds}
                                    >
                                        {createCardGrid(favoritedEntries ?? [])}
                                    </ThumbnailBatchProvider>
                                )}
                            </section>
                            <section className="flex flex-col gap-2">
                                {allDocumentsHeading}
                                {resultCountLine}
                                <ThumbnailBatchProvider
                                    batchKey={gridBatchKey}
                                    expectedContentIds={gridExpectedIds}
                                >
                                    {createCardGrid(entries)}
                                </ThumbnailBatchProvider>
                            </section>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {resultCountLine}
                            <ThumbnailBatchProvider
                                batchKey={gridBatchKey}
                                expectedContentIds={gridExpectedIds}
                            >
                                {createCardGrid(entries)}
                            </ThumbnailBatchProvider>
                        </div>
                    )
                ) : (
                    showFavoritesWithEntries ? (
                        <>
                            {displayedPage === 1 && (
                                <section className="flex flex-col gap-2 pb-6">
                                    {favoritesHeading}
                                    {favoritesOpen && createCardList(favoritedEntries ?? [])}
                                </section>
                            )}
                            <section className="flex min-h-0 flex-1 flex-col gap-2">
                                {allDocumentsHeading}
                                {resultCountLine}
                                {createCardList(pageEntries)}
                            </section>
                        </>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col">
                            {resultCountLine}
                            {createCardList(pageEntries)}
                        </div>
                    )
                ))}
                </>
    );

    // When favorites occupy slots on page 1, the effective document count for
    // pagination is inflated by numFav so the page total stays correct.
    const paginationDocNum = entries.length + numFav;

    const bottomPagination = (
        <div className="sticky bottom-0 mt-auto border-t border-border/70 bg-muted/50 pt-2">
            <Pagination
                docNum={paginationDocNum}
                docsPerPage={entriesPerPage}
                pageNum={pageNum}
                setPageNum={setPageNum}
                updatePageEntries={updatePageEntries}
            />
        </div>
    )

    const entryBody = (
            <SelectMarqueeLayer
                enabled={Boolean(selectMode && onMarqueeSelect)}
                blocked={marqueeBlocked}
                onCommit={marqueeCommit}
            >
                <div
                    className={cn(
                        contentClassName ??
                            "flex h-full min-h-0 flex-1 flex-col overflow-auto rounded-xl pt-2 pb-0",
                        selectMode && "select-none",
                    )}
                    onDragStartCapture={
                        selectMode ? (e) => e.preventDefault() : undefined
                    }
                >
                    {entryScrollInner}
                </div>
                {(view === "List" ? (
                    bottomPagination
                ) : (
                    <></>
                ))}
            </SelectMarqueeLayer>
    );

    if (omitToolbar) {
        return entryBody;
    }

    return (
        <div className={"bg-muted/50 flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl pt-2"}>
            <Toolbar
                extraElements={extraToolbarElements}
                viewSelectorButtonProps={viewSelectorButtonProps}
                queryProps={queryProps}
                showViewSelector={!forceGridView}
                toolbarLeadingSlot={toolbarLeadingSlot}
                toolbarCenterSlot={toolbarCenterSlot}
            />
            {entryBody}
        </div>
    )
}