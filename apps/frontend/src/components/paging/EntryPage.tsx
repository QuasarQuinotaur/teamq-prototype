/* eslint-disable react-hooks/preserve-manual-memoization -- entries array from parent each render */
// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

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
    /** List/grid tutorial: mark this entry’s row or card (`data-tutorial-doc-card`). */
    tutorialHighlightEntryId?: number | null;
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
    /** When set with `gridSkeletonCount`, each grid placeholder is rendered by this (otherwise ContentCardSkeleton). */
    gridSkeletonCell?: (index: number) => React.ReactNode;
    /** Accessible label for the grid skeleton region (e.g. "Loading employees"). */
    gridSkeletonAriaLabel?: string;
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
    /** When lengths sum to `entries.length`, `CardGrid` batches thumbnail reveal per chunk. */
    thumbnailChunkSizes?: number[];
    /** Same as `thumbnailChunkSizes` but for the favorites grid when `showFavoritesSection`. */
    favoritesThumbnailChunkSizes?: number[];
    /** Grid infinite scroll + list prefetch for paginated catalogs. */
    catalogInfiniteScroll?: {
        hasMore: boolean;
        loadingMore: boolean;
        onLoadMore: () => void;
    };
    /** When true, entry counts show a trailing "+" (more rows not loaded yet). */
    catalogHasMore?: boolean;
}
export default function EntryPage<T extends object>({
                                                        cardGridProps,
                                                        onListRowClick,
                                                        extraToolbarElements,
                                                        queryProps,
                                                        gridSkeletonCount,
                                                        gridSkeletonCell,
                                                        gridSkeletonAriaLabel,
                                                        favoritedEntries,
                                                        displayedEntryLabels,
                                                        showFavoritesSection = false,
                                                        omitToolbar = false,
                                                        forceGridView = false,
                                                        contentClassName,
                                                        listEntriesPerPage,
                                                        toolbarLeadingSlot,
                                                        toolbarCenterSlot,
                                                        thumbnailChunkSizes,
                                                        favoritesThumbnailChunkSizes,
                                                        catalogInfiniteScroll,
                                                        catalogHasMore,
                                                        ...entryProps
}: EntryPageProps<T> & EntryProps) {
    const {
        entries,
        listColumnOptions,
        tutorialHighlightEntryId,
        selectMode,
        onMarqueeSelect,
        marqueeBlocked,
        ...restEntryProps
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
    const [inputValue, setInputValue] = useState(String(entriesPerPage));

    useEffect(() => {
        setInputValue(String(entriesPerPage));
    }, [entriesPerPage]);

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

    function newNumEntries(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setInputValue(value);

        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
            setEntriesPerPage(num);
        }
    }

    const numEntriesInput = (
        <>
            <Input
                className="w-5 border-0 border-b rounded-none p-0 h-auto text-center text-muted-foreground"
                value={inputValue}
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
                            : ` ${entries.length}${catalogHasMore ? "+" : ""} ${displayedEntryLabels.other}`}
                        </p>
                    </>
                ) : (
                    <p
                        className="text-sm text-muted-foreground pl-1"
                        aria-live="polite"
                    >
                        {entries.length === 1
                            ? `1 ${displayedEntryLabels.one}`
                            : `${entries.length}${catalogHasMore ? "+" : ""} ${displayedEntryLabels.other}`}
                    </p>
                ))}
            </section>
        ) : null;

    const scrollRootRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
    const userHasScrolledCatalogRef = useRef(false);

    useEffect(() => {
        if (entries.length === 0) {
            userHasScrolledCatalogRef.current = false;
        }
    }, [entries.length]);

    useEffect(() => {
        const el = scrollRootRef.current;
        if (!el) return;
        const onScroll = () => {
            userHasScrolledCatalogRef.current = true;
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

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

    const thumbnailChunkSum = useMemo(
        () => thumbnailChunkSizes?.reduce((acc, n) => acc + n, 0) ?? 0,
        [thumbnailChunkSizes],
    );

    const mainGridUsesInnerThumbnailBatches =
        Boolean(thumbnailChunkSizes?.length) &&
        thumbnailChunkSum === entries.length &&
        entries.length > 0;

    const maxDocIndexExclusiveForListPage = useCallback(
        (viewPageNum: number) => {
            if (viewPageNum === 1) return slotsPage1;
            const first = slotsPage1 + entriesPerPage * (viewPageNum - 2);
            return first + entriesPerPage;
        },
        [slotsPage1, entriesPerPage],
    );

    useEffect(() => {
        if (view !== "List" || !catalogInfiniteScroll) return;
        const need = maxDocIndexExclusiveForListPage(displayedPage);
        if (need <= entries.length) return;
        if (!catalogInfiniteScroll.hasMore || catalogInfiniteScroll.loadingMore) {
            return;
        }
        catalogInfiniteScroll.onLoadMore();
    }, [
        view,
        displayedPage,
        entries.length,
        catalogInfiniteScroll,
        maxDocIndexExclusiveForListPage,
    ]);

    useEffect(() => {
        if (view !== "Grid" || !catalogInfiniteScroll?.hasMore) return;
        const root = scrollRootRef.current;
        const target = loadMoreSentinelRef.current;
        if (!root || !target) return;
        const obs = new IntersectionObserver(
            (observed) => {
                const hit = observed.some((e) => e.isIntersecting);
                if (
                    hit &&
                    userHasScrolledCatalogRef.current &&
                    catalogInfiniteScroll.hasMore &&
                    !catalogInfiniteScroll.loadingMore &&
                    !(gridSkeletonCount != null && gridSkeletonCount > 0 && entries.length === 0)
                ) {
                    catalogInfiniteScroll.onLoadMore();
                }
            },
            { root, rootMargin: "280px", threshold: 0 },
        );
        obs.observe(target);
        return () => obs.disconnect();
    }, [
        view,
        catalogInfiniteScroll?.hasMore,
        catalogInfiniteScroll?.loadingMore,
        catalogInfiniteScroll?.onLoadMore,
        entries.length,
        gridSkeletonCount,
    ]);

    function createCardGrid(gridEntries: CardEntry[], favoritesChunks?: number[]) {
        const favSum = favoritesChunks?.reduce((acc, n) => acc + n, 0) ?? 0;
        const useFavoritesInnerChunks =
            Boolean(favoritesChunks?.length) && favSum === gridEntries.length;
        const effectiveChunkSizes = useFavoritesInnerChunks
            ? favoritesChunks
            : mainGridUsesInnerThumbnailBatches
              ? thumbnailChunkSizes
              : undefined;
        return (
            <CardGrid
                {...cardGridProps}
                {...restEntryProps}
                entries={gridEntries}
                thumbnailChunkSizes={effectiveChunkSizes}
                isLoading={gridSkeletonCount != null && gridSkeletonCount > 0}
            />
        );
    }

    const catalogInfiniteFooter =
        view === "Grid" &&
        catalogInfiniteScroll &&
        (catalogInfiniteScroll.hasMore || catalogInfiniteScroll.loadingMore) ? (
            <div className="flex w-full flex-col items-center gap-2 px-10 pb-6">
                {catalogInfiniteScroll.hasMore ? (
                    <div
                        ref={loadMoreSentinelRef}
                        className="h-2 w-full shrink-0"
                        aria-hidden
                    />
                ) : null}
                {catalogInfiniteScroll.loadingMore ? (
                    <Loader2
                        className="size-6 animate-spin text-muted-foreground"
                        aria-label="Loading more documents"
                    />
                ) : null}
            </div>
        ) : null;

    function wrapMainGrid(inner: React.ReactNode) {
        if (mainGridUsesInnerThumbnailBatches) {
            return inner;
        }
        return (
            <ThumbnailBatchProvider
                batchKey={gridBatchKey}
                expectedContentIds={gridExpectedIds}
            >
                {inner}
            </ThumbnailBatchProvider>
        );
    }

    function createCardList(listEntries: CardEntry[]) {
        return (
            <CardList
                {...restEntryProps}
                entries={listEntries}
                onRowClick={onListRowClick}
                listColumnOptions={listColumnOptions}
                tutorialHighlightEntryId={tutorialHighlightEntryId}
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
                            aria-label={gridSkeletonAriaLabel ?? "Loading documents"}
                        >
                            {Array.from({ length: gridSkeletonCount }, (_, i) => (
                                <React.Fragment key={i}>
                                    {gridSkeletonCell != null
                                        ? gridSkeletonCell(i)
                                        : <ContentCardSkeleton />}
                                </React.Fragment>
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
                                        {createCardGrid(
                                            favoritedEntries ?? [],
                                            favoritesThumbnailChunkSizes,
                                        )}
                                    </ThumbnailBatchProvider>
                                )}
                            </section>
                            <section className="flex flex-col gap-2">
                                {allDocumentsHeading}
                                {resultCountLine}
                                {wrapMainGrid(createCardGrid(entries))}
                                {catalogInfiniteFooter}
                            </section>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {resultCountLine}
                            {wrapMainGrid(createCardGrid(entries))}
                            {catalogInfiniteFooter}
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
                    ref={scrollRootRef}
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