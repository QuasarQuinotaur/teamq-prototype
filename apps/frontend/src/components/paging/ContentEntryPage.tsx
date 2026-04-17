// ContentEntryPage used for Workflow/Reference/Tools pages
// It makes an EntryPage with Card + List view showing all content
// A specific type can be specified (workflow, reference, tool) to only show that type of content

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useSearchParams } from "react-router-dom";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content, Employee} from "db";
import * as React from "react";
import EntryPage from "@/components/paging/EntryPage.tsx";
import SplitDocumentWorkspace from "@/components/paging/SplitDocumentWorkspace.tsx";
import SplitScreenEdgeAffordance from "@/components/paging/SplitScreenEdgeAffordance.tsx";
import ContentCard from "@/components/cards/ContentCard.tsx";
import FormAddButton from "@/components/forms/FormAddButton.tsx";
import ModifyDropdown from "@/components/paging/ModifyDropdown.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/elements/avatar.tsx";
import DocumentViewer from "@/components/DocumentViewer.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import { isDocumentLikeFilename } from "@/lib/document-kind.ts";
import type {FormOfTypeProps} from "@/components/forms/FormOfType.tsx";
import FilterDocumentFields, {type ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";
import useContentQueryEntries from "@/components/paging/hooks/content-query-entries.tsx";
import {DropdownMenuCheckboxItem} from "@/components/DropdownMenu.tsx";
import {StarIcon} from "@phosphor-icons/react";
import {CONTENT_SORT_BY_MAP} from "@/components/input/constants.tsx";
import useContentSortFunction from "@/components/paging/hooks/content-sort-function.tsx";
import type {SortFields} from "@/components/forms/SortForm.tsx";
import {DEFAULT_SORT_FIELDS} from "@/components/paging/hooks/sort-function.tsx";
import {
    notifyContentCheckoutSync,
    subscribeContentCheckoutSync,
} from "@/lib/content-checkout-sync.ts";
import axios from "axios";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import type { ViewSelectorButtonProps } from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import { cn } from "@/lib/utils.ts";

type ViewerState = {
    contentId: number;
    url: string;
    filename: string;
    title: string;
};

function filenameFromEntry(entry: CardEntry): string {
    return entry.link.split("/").pop()?.split("?")[0] ?? entry.title;
}


type ContentEntryPageProps = {
    /** Leave empty to show all documents: category filter starts empty (show all); use filter panel for categories. */
    contentType?: string;
    onlyFavorites?: boolean;
}

/** Fixed grid of placeholders while the first content request is in flight. */
const SKELETON_GRID_SLOTS = 25;

const apiBase = import.meta.env.VITE_BACKEND_URL;

/** True when filter panel matches the page baseline (no extra narrowing vs default). */
function contentFiltersEqualToBaseline(
    current: ContentFieldsFilter,
    baseline: ContentFieldsFilter,
): boolean {
    const pack = (f: ContentFieldsFilter) =>
        JSON.stringify({
            c: [...(f.contentTypes ?? [])].sort(),
            j: [...(f.jobPositions ?? [])].sort(),
            d: [...(f.documentTypes ?? [])].sort(),
        });
    return pack(current) === pack(baseline);
}

type ContentWithCheckout = Content & {
    isCheckedOut?: boolean;
    checkedOutById?: number | null;
    checkedOutBy?: {
        firstName: string;
        lastName: string;
        profileImageUrl?: string;
    } | null;
};

export default function ContentEntryPage({
                                             contentType,
                                             onlyFavorites
}: ContentEntryPageProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    /** Fullscreen single-document view (when not in split workspace). */
    const [fullscreenDoc, setFullscreenDoc] = useState<ViewerState | null>(null);
    const [splitMode, setSplitMode] = useState(
        () => new URLSearchParams(window.location.search).get("split") === "1",
    );
    /** Per-pane document; null means that pane shows the grid. */
    const [leftPaneDoc, setLeftPaneDoc] = useState<ViewerState | null>(null);
    const [rightPaneDoc, setRightPaneDoc] = useState<ViewerState | null>(null);
    const [employeeMap, setEmployeeMap] = useState<Map<number, string>>(new Map());
    const [employee, setEmployee] = useState<Employee>(null);

    useEffect(() => {
        setSplitMode(searchParams.get("split") === "1");
    }, [searchParams]);

    const fetchViewerState = useCallback(async (entry: CardEntry): Promise<ViewerState | null> => {
        const id = entry.item.id;
        const res = await fetch(`${apiBase}/api/content/${id}/download`, {
            credentials: "include",
        });
        if (!res.ok) return null;
        const { url } = await res.json();
        const filename = filenameFromEntry(entry);
        return { contentId: id, url, filename, title: entry.title };
    }, []);

    /** Open document fullscreen from main grid. */
    async function handleViewFullscreen(entry: CardEntry) {
        const state = await fetchViewerState(entry);
        if (state) setFullscreenDoc(state);
    }

    const openDocInLeftPane = useCallback(
        async (entry: CardEntry) => {
            const state = await fetchViewerState(entry);
            if (state) setLeftPaneDoc(state);
        },
        [fetchViewerState],
    );

    const openDocInRightPane = useCallback(
        async (entry: CardEntry) => {
            const state = await fetchViewerState(entry);
            if (state) setRightPaneDoc(state);
        },
        [fetchViewerState],
    );

    const enterSplitFromGrid = useCallback(() => {
        setSplitMode(true);
        setLeftPaneDoc(null);
        setRightPaneDoc(null);
        setFullscreenDoc(null);
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("split", "1");
                return next;
            },
            { replace: true },
        );
    }, [setSearchParams]);

    const enterSplitFromFullscreen = useCallback(() => {
        if (!fullscreenDoc) return;
        setSplitMode(true);
        setLeftPaneDoc(fullscreenDoc);
        setRightPaneDoc(null);
        setFullscreenDoc(null);
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("split", "1");
                return next;
            },
            { replace: true },
        );
    }, [fullscreenDoc, setSearchParams]);

    const exitSplit = useCallback(() => {
        setSplitMode(false);
        setLeftPaneDoc(null);
        setRightPaneDoc(null);
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.delete("split");
                return next;
            },
            { replace: true },
        );
    }, [setSearchParams]);

    const clearLeftPaneDoc = useCallback(() => setLeftPaneDoc(null), []);
    const clearRightPaneDoc = useCallback(() => setRightPaneDoc(null), []);

    const leftDocPayload = useMemo(
        () =>
            leftPaneDoc
                ? {
                      url: leftPaneDoc.url,
                      filename: leftPaneDoc.filename,
                      title: leftPaneDoc.title,
                  }
                : null,
        [leftPaneDoc],
    );
    const rightDocPayload = useMemo(
        () =>
            rightPaneDoc
                ? {
                      url: rightPaneDoc.url,
                      filename: rightPaneDoc.filename,
                      title: rightPaneDoc.title,
                  }
                : null,
        [rightPaneDoc],
    );

    useEffect(() => {
        fetch(`${apiBase}/api/employee`, { credentials: "include" })
            .then(res => res.json())
            .then((employees: Employee[]) => {
                setEmployeeMap(new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`])));
            })
            .catch(() => {});
    }, []);
    
    const api = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
        withCredentials: true,
    });
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/me');
                setEmployee(response.data);
            } catch (error) {
                console.error("Not logged in or no employee record found", error);
            }
        };
        void fetchUser();
    }, []);

    // This gets all content for the signed-in user
    function fetchContent() {
        const isInitialLoad = entries.length === 0;
        if (isInitialLoad) setLoading(true);

        fetch(`${apiBase}/api/content`, { credentials: "include" })
            .then((res) => res.json())
            .then((data: Content[]) => {
                const mapped: CardEntry[] = data.map((item) => ({
                    item: item,
                    title: item.title,
                    link: item.filePath ?? "",
                    owner:
                        employeeMap.get(item.ownerId) ?? undefined,
                    badge: item.contentType,
                    expirationDate: item.expirationDate
                }));
                setEntries(mapped);
            })
            .finally(() => {
                if (isInitialLoad) setLoading(false);
            });
    }

    const fetchContentRef = useRef(fetchContent);
    fetchContentRef.current = fetchContent;
    useEffect(() => {
        return subscribeContentCheckoutSync(() => {
            fetchContentRef.current();
        });
    }, []);

    useEffect(() => {
        fetchContent();
    }, [employeeMap]);

    // Delete content
    async function handleDelete(entry: CardEntry) {
        const res = await fetch(`${apiBase}/api/content/${entry.item.id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error("Delete failed");
        }
        fetchContent();
        notifyContentCheckoutSync();
    }

    const [favoritedList, setFavoritedList] = useState<{ id: number }[]>([])

    // All favorites for logged in user
    const fetchFavorites = useCallback(async () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/favorites`, { credentials: "include" })
            .then((res) => res.json())
            .then((data: { id: number }[]) => {
                setFavoritedList(data);
            })
    }, [])
    useEffect(() => {
        void fetchFavorites()
    }, [fetchFavorites])

    const defaultFieldsFilter = useMemo((): ContentFieldsFilter => (
        (contentType ? { contentTypes: [contentType], jobPositions: [] } : {})
    ), [contentType]);
    const [fieldsFilter, setFieldsFilter] = useState<ContentFieldsFilter>(defaultFieldsFilter);
    const defaultSortFields: SortFields = DEFAULT_SORT_FIELDS
    const [sortFields, setSortFields] = useState(defaultSortFields)
    const sortFunction = useContentSortFunction({sortFields})
    const [searchPhrase, setSearchPhrase] = useState("")
    const queryEntries = useContentQueryEntries({
        entries: onlyFavorites ? entries.filter(entry => {
            return favoritedList.some((favorite: object & { id: number }) => favorite.id === entry.item.id)
        }) : entries,
        searchPhrase,
        fieldsFilter,
        sortFunction,
    })

    const closeFullscreen = useCallback(() => {
        setFullscreenDoc(null);
    }, []);

    const hasActiveFilterOrSearch = useMemo(() => {
        if (searchPhrase.trim() !== "") return true;
        return !contentFiltersEqualToBaseline(fieldsFilter, defaultFieldsFilter);
    }, [searchPhrase, fieldsFilter, defaultFieldsFilter]);

    const showFavoritesSection =
        !onlyFavorites && !hasActiveFilterOrSearch;

    const formOfTypeProps: FormOfTypeProps = {
        formType: "Document",
        onCancel: fetchContent,
        defaultItem: {
            contentType: contentType,
        },
    };
    const formAddButton = <FormAddButton {...formOfTypeProps}/>;

    const listColumnOptions = useMemo(
        () => ({
            renderTitleCell(entry: CardEntry) {
                const item = entry.item as ContentWithCheckout;
                if (!item.isCheckedOut) return entry.title;
                const u = item.checkedOutBy;
                const initials = u
                    ? `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.trim() || "?"
                    : "?";
                return (
                    <div className="flex min-w-0 items-center gap-2">
                        <Avatar size="sm" className="shrink-0 ring-2 ring-background">
                            {u?.profileImageUrl ? (
                                <AvatarImage src={u.profileImageUrl} alt="" />
                            ) : null}
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{entry.title}</span>
                    </div>
                );
            },
        }),
        [],
    );

    async function tryAddFavorite(contentId: number) {
        try {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/favorites/${contentId}`, {
                method: "POST",
                credentials: "include",
            }).then(fetchFavorites);
        } catch (err) {
            console.error("Add favorite failed", err);
        }
    }
    async function tryDeleteFavorite(contentId: number) {
        try {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/favorites/${contentId}`, {
                method: "DELETE",
                credentials: "include",
            }).then(fetchFavorites);
        } catch (err) {
            console.error("Delete favorite failed", err);
        }
    }

    // Make card "..." show dropdown to modify documents
    const createOptionsElement =
        (entry: CardEntry, trigger: React.ReactNode) => {
            const item = entry.item as ContentWithCheckout;
            const id = item.id;
            const isFavorited = favoritedList.some((item) => item.id === id);
            const extraMenuItems = <>
                <DropdownMenuCheckboxItem
                    checked={isFavorited}
                    onCheckedChange={(newFavorited) => {
                        if (newFavorited) {
                            void tryAddFavorite(id);
                        }
                        else {
                            void tryDeleteFavorite(id);
                        }
                    }}
                >
                    <StarIcon weight={isFavorited ? "fill" : "regular"}/>
                    Favorite
                </DropdownMenuCheckboxItem>
            </>
            const checkoutBlocksActions = item.isCheckedOut === true;

            const isOwner = employee && item.ownerId === employee.id;
            const isAdmin = employee && employee.jobPosition === "admin";
            const canModify = isOwner || isAdmin;
            const editError = canModify ? null : "You do not have authorization to edit this content."
            const deleteError = canModify ? null : "You do not have authorization to delete this content."

            return ModifyDropdown({
                entry,
                trigger,
                ...formOfTypeProps,
                handleDelete: handleDelete,
                extraMenuItems,
                editError,
                deleteError,
                documentCheckout: {
                    checkoutBlocksActions,
                    onCheckout: async () => {
                        const res = await fetch(`${apiBase}/api/content/checkout/${item.id}`, {
                            method: "POST",
                            credentials: "include",
                        });
                        const ok = res.ok;
                        if (ok) notifyContentCheckoutSync();
                        return ok;
                    },
                    onRelease: () => {
                        void fetch(`${apiBase}/api/content/checkin/${item.id}`, {
                            method: "POST",
                            credentials: "include",
                        }).finally(() => {
                            fetchContent();
                            notifyContentCheckoutSync();
                        });
                    },
                },
            });
        }

    const showContentTypeBadge = useMemo(() => {
        const types = new Set(
            queryEntries.map((e) => (e.item as Content).contentType),
        );
        return types.size > 1;
    }, [queryEntries]);
    const showJobPositionBadge = useMemo(() => {
        const positions = new Set(
            queryEntries.flatMap((e) => (e.item as Content).jobPositions),
        );
        return positions.size > 1;
    }, [queryEntries]);

    // Track properties to update querying
    const queryProps: QueryProps<ContentFieldsFilter> = {
        searchBarProps: {
            setFilter: setSearchPhrase
        },
        filterButtonProps: {
            emptyFields: {},
            defaultFields: defaultFieldsFilter,
            fields: fieldsFilter,
            setFields: setFieldsFilter,
            createFieldsElement: FilterDocumentFields,
        },
        sortButtonProps: {
            sortByMap: CONTENT_SORT_BY_MAP,
            defaultSortFields,
            sortFields,
            setSortFields,
        }
    }

    const gridSkeletonCount =
        loading && entries.length === 0 ? SKELETON_GRID_SLOTS : null;

    const favoritedQueryEntries = useMemo(() => {
        if (favoritedList.length === 0) return [];
        return queryEntries.filter((entry) =>
            favoritedList.some((f) => f.id === entry.item.id),
        );
    }, [queryEntries, favoritedList]);

    const { view, setView } = useMainContext();
    const viewSelectorButtonProps: ViewSelectorButtonProps = { view, setView };

    const embeddedContentClassName =
        "flex flex-col flex-1 min-h-0 overflow-auto px-1 pb-0 pt-3";

    if (splitMode) {
        const leftPaneEntryPage = (
            <EntryPage
                key="split-left-grid"
                entries={queryEntries}
                displayedEntryLabels={{ one: "document", other: "documents" }}
                showFavoritesSection={showFavoritesSection}
                favoritedEntries={favoritedQueryEntries}
                gridSkeletonCount={gridSkeletonCount}
                createOptionsElement={createOptionsElement}
                listColumnOptions={listColumnOptions}
                onListRowClick={openDocInLeftPane}
                omitToolbar
                contentClassName={embeddedContentClassName}
                cardGridProps={{
                    renderCard: (state) => (
                        <ContentCard
                            key={state.entry.item.id}
                            onView={openDocInLeftPane}
                            showContentTypeBadge={showContentTypeBadge}
                            showJobPositionBadge={showJobPositionBadge}
                            {...state}
                        />
                    ),
                }}
                queryProps={queryProps}
            />
        );
        const rightPaneEntryPage = (
            <EntryPage
                key="split-right-grid"
                entries={queryEntries}
                displayedEntryLabels={{ one: "document", other: "documents" }}
                showFavoritesSection={showFavoritesSection}
                favoritedEntries={favoritedQueryEntries}
                gridSkeletonCount={gridSkeletonCount}
                createOptionsElement={createOptionsElement}
                listColumnOptions={listColumnOptions}
                onListRowClick={openDocInRightPane}
                omitToolbar
                contentClassName={embeddedContentClassName}
                cardGridProps={{
                    renderCard: (state) => (
                        <ContentCard
                            key={state.entry.item.id}
                            onView={openDocInRightPane}
                            showContentTypeBadge={showContentTypeBadge}
                            showJobPositionBadge={showJobPositionBadge}
                            {...state}
                        />
                    ),
                }}
                queryProps={queryProps}
            />
        );
        return (
            <div className="bg-muted/50 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl pt-2">
                <Toolbar
                    extraElements={[
                        formAddButton,
                        <Button key="exit-split" variant="outline" size="sm" type="button" onClick={exitSplit}>
                            Exit split
                        </Button>,
                    ]}
                    viewSelectorButtonProps={viewSelectorButtonProps}
                    queryProps={queryProps}
                    showViewSelector
                />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col px-1 pb-2">
                    <SplitDocumentWorkspace
                        leftDoc={leftDocPayload}
                        rightDoc={rightDocPayload}
                        onLeftBackToGrid={clearLeftPaneDoc}
                        onRightBackToGrid={clearRightPaneDoc}
                        leftGrid={leftPaneEntryPage}
                        rightGrid={rightPaneEntryPage}
                    />
                </div>
            </div>
        );
    }

    if (fullscreenDoc) {
        const canEnterSplit = isDocumentLikeFilename(fullscreenDoc.filename);
        return (
            <DocumentViewer
                url={fullscreenDoc.url}
                filename={fullscreenDoc.filename}
                title={fullscreenDoc.title}
                onClose={closeFullscreen}
                canEnterSplit={canEnterSplit}
                onEnterSplit={canEnterSplit ? enterSplitFromFullscreen : undefined}
            />
        );
    }

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <EntryPage
                entries={queryEntries}
                displayedEntryLabels={{ one: "document", other: "documents" }}
                showFavoritesSection={showFavoritesSection}
                favoritedEntries={favoritedQueryEntries}
                gridSkeletonCount={gridSkeletonCount}
                createOptionsElement={createOptionsElement}
                listColumnOptions={listColumnOptions}
                onListRowClick={handleViewFullscreen}
                contentClassName={cn(
                    "flex flex-col flex-1 rounded-xl min-h-0 overflow-auto pt-2 pb-0",
                    "pr-3 md:pr-12",
                )}
                cardGridProps={{
                    renderCard: ((state) => (
                        <ContentCard
                            key={state.entry.item.id}
                            onView={handleViewFullscreen}
                            showContentTypeBadge={showContentTypeBadge}
                            showJobPositionBadge={showJobPositionBadge}
                            {...state}
                        />
                    )),
                }}
                extraToolbarElements={[
                    formAddButton,
                    <Button
                        key="split-view"
                        variant="outline"
                        size="sm"
                        type="button"
                        className="md:hidden"
                        onClick={enterSplitFromGrid}
                    >
                        Split view
                    </Button>,
                ]}
                queryProps={queryProps}
            />
            <SplitScreenEdgeAffordance onActivate={enterSplitFromGrid} />
        </div>
    );
}
