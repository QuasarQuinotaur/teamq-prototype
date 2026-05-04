// ContentEntryPage used for Workflow/Reference/Tools pages
// It makes an EntryPage with Card + List view showing all content
// A specific type can be specified (workflow, reference, tool) to only show that type of content

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content, Employee, Tag} from "db";
import * as React from "react";
import EntryPage from "@/components/paging/EntryPage.tsx";
import SplitDocumentWorkspace from "@/components/paging/SplitDocumentWorkspace.tsx";
import SplitScreenEdgeAffordance from "@/components/paging/SplitScreenEdgeAffordance.tsx";
import ContentCard from "@/components/cards/ContentCard.tsx";
import FormAddButton from "@/components/forms/FormAddButton.tsx";
import ModifyDropdown, {type DocumentCheckoutOptions} from "@/components/paging/ModifyDropdown.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/elements/avatar.tsx";
import DocumentViewer from "@/components/DocumentViewer.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import Toolbar from "@/components/paging/toolbar/Toolbar.tsx";
import { isDocumentLikeFilename } from "@/lib/document-kind.ts";
import type {FormOfTypeProps} from "@/components/forms/FormOfType.tsx";
import FilterDocumentFields, {type ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";
import { DropdownMenuCheckboxItem } from "@/components/DropdownMenu.tsx";
import { Loader2 } from "lucide-react";
import { StarIcon } from "@phosphor-icons/react";
import { THUMBNAIL_CHUNK_SIZE, toChunkSizes } from "@/lib/thumbnailChunks.ts";
import {CONTENT_SORT_BY_MAP} from "@/components/input/constants.tsx";
import type {SortFields} from "@/components/forms/SortForm.tsx";
import {DEFAULT_SORT_FIELDS, DEFAULT_SORT_FIELDS_RECENT} from "@/components/paging/hooks/sort-function.tsx";
import {
    notifyContentCheckoutSync,
    subscribeContentCheckoutSync,
} from "@/lib/content-checkout-sync.ts";
import axios from "axios";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import type { ViewSelectorButtonProps } from "@/components/paging/toolbar/ViewSelectorButton.tsx";
import { cn, isSupabasePath } from "@/lib/utils.ts";
import ContentDetailsOption from "@/components/paging/details/ContentDetailsOption.tsx";
import TagsOption from "@/components/paging/tags/TagsOption.tsx";
import useGetEmployeeIsAdmin from "@/hooks/useGetEmployeeIsAdmin";
import ContentReviewsOption from "./review/ContentReviewsOption";
import { useTutorial } from "@/components/tutorial/TutorialContext.tsx";

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
    /** When set, pre-filters to a specific job position role. */
    jobPosition?: string;
    onlyFavorites?: boolean;
    /** Documents whose `ownerId` is the current user (uploaded by you). */
    onlyMine?: boolean;
    /** Documents you currently have checked out. */
    onlyMyCheckouts?: boolean;
    /** Documents opened recently. */
    onlyRecents?: boolean;
    /** Separate table for the tutorial */
    isTutorial?: boolean;
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

/** List row from `GET /api/content` (includes `tags` when loaded via catalog query). */
type ContentListRow = Content & {
    tags?: { tag: Tag }[];
};

const CATALOG_INITIAL_LIMIT = 30;
const CATALOG_PAGE_LIMIT = 20;

function parsePaginatedCatalogBody(
    data: unknown,
    onlyRecents: boolean,
): { rows: ContentListRow[]; hasMore: boolean } {
    if (onlyRecents) {
        const body = data as {
            recent?: Array<{ content: ContentListRow }>;
            hasMore?: boolean;
        };
        const rows = (body.recent ?? []).map((r) => r.content);
        return { rows, hasMore: Boolean(body.hasMore) };
    }
    if (Array.isArray(data)) {
        return { rows: data as ContentListRow[], hasMore: false };
    }
    const body = data as { items?: ContentListRow[]; hasMore?: boolean };
    return {
        rows: body.items ?? [],
        hasMore: Boolean(body.hasMore),
    };
}

function buildContentListQueryString(opts: {
    fieldsFilter: ContentFieldsFilter;
    debouncedSearch: string;
    sortFields: SortFields;
    onlyFavorites?: boolean;
    onlyMine?: boolean;
    onlyMyCheckouts?: boolean;
    /** `/tutorial/*` lists pass this so API returns owned tutorial rows; `/documents/*` omits it. */
    includeTutorialDocuments?: boolean;
    limit?: number;
    offset?: number;
}): string {
    const p = new URLSearchParams();
    const {
        fieldsFilter,
        debouncedSearch,
        sortFields,
        onlyFavorites,
        onlyMine,
        onlyMyCheckouts,
        includeTutorialDocuments,
        limit,
        offset,
    } = opts;
    for (const c of fieldsFilter.contentTypes ?? []) p.append("contentTypes", c);
    for (const j of fieldsFilter.jobPositions ?? []) p.append("jobPositions", j);
    for (const d of fieldsFilter.documentTypes ?? [])
        p.append("documentTypes", d);
    for (const id of fieldsFilter.tagIds ?? []) p.append("tagIds", String(id));
    const q = debouncedSearch.trim();
    if (q) p.set("q", q);
    p.set("sortBy", sortFields.sortBy);
    p.set("sortMethod", sortFields.sortMethod);
    if (onlyFavorites) p.set("onlyFavorites", "1");
    if (onlyMine) p.set("onlyMine", "1");
    if (onlyMyCheckouts) p.set("onlyMyCheckouts", "1");
    if (includeTutorialDocuments) p.set("includeTutorialDocuments", "1");
    if (limit != null) p.set("limit", String(limit));
    if (offset != null) p.set("offset", String(offset));
    return p.toString();
}

function getContentEntryFromRow(
    content: ContentListRow,
    employee: Employee | null,
    employeeMap: Map<number, { name: string; image?: string }>,
): CardEntry {
    const tags: Tag[] =
        content.tags
            ?.map((ct) => ct.tag)
            .filter((t) =>
                employee
                    ? t.isGlobal || t.ownerId === employee.id
                    : false,
            ) ?? [];
    const ownerRecord = employeeMap.get(content.ownerId);
    return {
        item: content,
        title: content.title,
        link: content.filePath ?? "",
        owner: ownerRecord?.name,
        ownerImage: ownerRecord?.image,
        badge: content.contentType,
        expirationDate: content.expirationDate,
        tags,
    };
}

export default function ContentEntryPage({
                                             contentType,
                                             jobPosition,
                                             onlyFavorites,
                                             onlyMine,
                                             onlyMyCheckouts,
                                             onlyRecents,
                                             isTutorial,
}: ContentEntryPageProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const tutorial = useTutorial();
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [catalogHasMore, setCatalogHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [thumbnailChunkSizes, setThumbnailChunkSizes] = useState<number[]>([]);
    const entriesRef = useRef<CardEntry[]>([]);
    entriesRef.current = entries;
    /** Fullscreen single-document view (when not in split workspace). */
    const [fullscreenDoc, setFullscreenDoc] = useState<ViewerState | null>(null);
    const [splitMode, setSplitMode] = useState(
        () => new URLSearchParams(window.location.search).get("split") === "1",
    );
    /** Per-pane document; null means that pane shows the grid. */
    const [leftPaneDoc, setLeftPaneDoc] = useState<ViewerState | null>(null);
    const [rightPaneDoc, setRightPaneDoc] = useState<ViewerState | null>(null);
    const [employeeMap, setEmployeeMap] = useState<Map<number, { name: string; image?: string }>>(new Map());
    const [employee, setEmployee] = useState<Employee>(null);
    const employeeRef = useRef<Employee>(null);
    const employeeMapRef = useRef(employeeMap);
    employeeRef.current = employee;
    employeeMapRef.current = employeeMap;
    /** Monotonic id so overlapping `resetCatalog` runs (e.g. Strict Mode) only the latest applies state. */
    const catalogResetGenRef = useRef(0);

    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    const onContentOpened = useCallback((entry: CardEntry) => {
        console.log("CONTENT OPENED NOW", entry)
        // Mark as viewed for recent documents
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${entry.item.id}/view`, {
            method: "POST",
            credentials: "include",
        });
    }, [])

    const exitSelectMode = useCallback(() => {
        setSelectMode(false);
        setSelectedIds(new Set());
    }, []);

    const isEntrySelected = useCallback(
        (e: CardEntry) => selectedIds.has(e.item.id),
        [selectedIds],
    );

    const onToggleEntrySelect = useCallback((e: CardEntry) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(e.item.id)) next.delete(e.item.id);
            else next.add(e.item.id);
            return next;
        });
    }, []);

    const onMarqueeSelect = useCallback(
        (entryIds: number[]) => {
            if (bulkActionLoading) return;
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const id of entryIds) {
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                }
                return next;
            });
        },
        [bulkActionLoading],
    );

    const wrapRowOpen = useCallback(
        (opener: (entry: CardEntry) => void | Promise<void>) => {
            return (entry: CardEntry) => {
                if (selectMode && bulkActionLoading) return;
                if (selectMode) {
                    onToggleEntrySelect(entry);
                    return;
                }
                onContentOpened(entry);
                // Web links (non-file paths) open directly in a new tab
                if (entry.link && !isSupabasePath(entry.link)) {
                    window.open(entry.link, "_blank", "noopener,noreferrer");
                    return;
                }
                void opener(entry);
            };
        },
        [selectMode, bulkActionLoading, onToggleEntrySelect, onContentOpened],
    );

    const openDocumentMenuFromRow = useCallback((entry: CardEntry, e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.querySelector<HTMLElement>(
            `[data-document-menu-trigger="${entry.item.id}"]`,
        );
        el?.click();
    }, []);

    useEffect(() => {
        setSplitMode(searchParams.get("split") === "1");
    }, [searchParams]);

    const fetchViewerState = useCallback(async (entry: CardEntry): Promise<ViewerState | null> => {
        const id = entry.item.id;
        // fixed
        const res = await fetch(`${apiBase}/api/content/${id}/file-url`, {
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
                      contentId: leftPaneDoc.contentId,
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
                      contentId: rightPaneDoc.contentId,
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
            .then((employees: (Employee & { image?: string })[]) => {
                setEmployeeMap(new Map(employees.map(e => [e.id, { name: `${e.firstName} ${e.lastName}`, image: e.image }])));
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

    const [tagList, setTagList] = useState<Tag[]>([])

    // Fetches a list of all tags employee has made
    async function fetchTagList() {
        try {
            const tagsResponse = await fetch(
                `${apiBase}/api/tags`,
                {credentials: "include"}
            );
            const tagsData = await tagsResponse.json()
            if (!tagsData.success) throw new Error("Failed to find tags.")
            setTagList(tagsData.tags)
        } catch (error) {
            console.error(error)
        }
    }

    /** Single-row fetch — faster than waiting for full catalog when only one id matters (e.g. tutorial). */
    const fetchContentById = useCallback((contentId: number) => {
        fetch(`${apiBase}/api/content/${contentId}`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                const content = data.content as ContentListRow;
                const mapEntry = getContentEntryFromRow(
                    content,
                    employeeRef.current,
                    employeeMapRef.current,
                );
                setEntries((prev) => {
                    const has = prev.some((e) => e.item.id === contentId);
                    if (!has) return [...prev, mapEntry];
                    return prev.map((entry) =>
                        entry.item.id === contentId ? mapEntry : entry,
                    );
                });
            });
    }, []);

    const defaultSortFields: SortFields = onlyRecents ? DEFAULT_SORT_FIELDS_RECENT : DEFAULT_SORT_FIELDS
    const [sortFields, setSortFields] = useState(defaultSortFields)
    const [searchPhrase, setSearchPhrase] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedSearch(searchPhrase), 300);
        return () => clearTimeout(t);
    }, [searchPhrase]);

    const defaultFieldsFilter = useMemo((): ContentFieldsFilter => ({
        ...(contentType ? { contentTypes: [contentType] } : {}),
        ...(jobPosition ? { jobPositions: [jobPosition] } : {}),
    }), [contentType, jobPosition]);
    const [filterJobPosition, setFilterJobPosition] = useState(jobPosition);
    const [fieldsFilter, setFieldsFilter] = useState(defaultFieldsFilter);
    useEffect(() => {
        if (filterJobPosition !== jobPosition) {
            setFilterJobPosition(jobPosition)
            setFieldsFilter(defaultFieldsFilter)
        }
    }, [jobPosition, filterJobPosition, defaultFieldsFilter])

    const resetCatalog = useCallback(async () => {
        const gen = ++catalogResetGenRef.current;
        setLoading(true);
        setLoadingMore(false);
        setEntries([]);
        setThumbnailChunkSizes([]);
        setCatalogHasMore(false);

        const onTutorialDocumentsRoute = location.pathname.startsWith(
            "/tutorial",
        );
        const includeTutorialDocuments =
            onTutorialDocumentsRoute &&
            Boolean(onlyMine || onlyMyCheckouts || onlyRecents);
        const qs = buildContentListQueryString({
            fieldsFilter,
            debouncedSearch,
            sortFields,
            onlyFavorites,
            onlyMine,
            onlyMyCheckouts,
            includeTutorialDocuments,
            limit: CATALOG_INITIAL_LIMIT,
            offset: 0,
        });
        const url =
            `${apiBase}/api/content` +
            (onlyRecents ? "/recent" : "") +
            (qs ? `?${qs}` : "");
        console.log(qs, url);
        try {
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load content");
            const data: unknown = await res.json();
            const { rows, hasMore } = parsePaginatedCatalogBody(data, onlyRecents);
            const mapped = rows.map((c) =>
                getContentEntryFromRow(
                    c,
                    employeeRef.current,
                    employeeMapRef.current,
                ),
            );
            if (gen !== catalogResetGenRef.current) return;
            setEntries(mapped);
            setThumbnailChunkSizes(toChunkSizes(mapped.length, THUMBNAIL_CHUNK_SIZE));
            setCatalogHasMore(hasMore);
        } catch (err) {
            console.error(err);
            if (gen !== catalogResetGenRef.current) return;
            setEntries([]);
            setThumbnailChunkSizes([]);
            setCatalogHasMore(false);
        } finally {
            if (gen === catalogResetGenRef.current) {
                setLoading(false);
            }
        }
    }, [
        location.pathname,
        fieldsFilter,
        debouncedSearch,
        sortFields,
        onlyFavorites,
        onlyMine,
        onlyMyCheckouts,
        onlyRecents,
    ]);

    const loadMoreCatalog = useCallback(async () => {
        if (!catalogHasMore || loadingMore || loading) return;
        const offset = entriesRef.current.length;
        setLoadingMore(true);

        const onTutorialDocumentsRoute = location.pathname.startsWith(
            "/tutorial",
        );
        const includeTutorialDocuments =
            onTutorialDocumentsRoute &&
            Boolean(onlyMine || onlyMyCheckouts || onlyRecents);
        const qs = buildContentListQueryString({
            fieldsFilter,
            debouncedSearch,
            sortFields,
            onlyFavorites,
            onlyMine,
            onlyMyCheckouts,
            includeTutorialDocuments,
            limit: CATALOG_PAGE_LIMIT,
            offset,
        });
        const url =
            `${apiBase}/api/content` +
            (onlyRecents ? "/recent" : "") +
            (qs ? `?${qs}` : "");

        try {
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load content");
            const data: unknown = await res.json();
            const { rows, hasMore } = parsePaginatedCatalogBody(data, onlyRecents);
            const mapped = rows.map((c) =>
                getContentEntryFromRow(
                    c,
                    employeeRef.current,
                    employeeMapRef.current,
                ),
            );
            setEntries((prev) => {
                const seen = new Set(prev.map((e) => e.item.id));
                const add = mapped.filter((e) => !seen.has(e.item.id));
                return [...prev, ...add];
            });
            if (mapped.length > 0) {
                setThumbnailChunkSizes((prev) => [
                    ...prev,
                    ...toChunkSizes(mapped.length, THUMBNAIL_CHUNK_SIZE),
                ]);
            }
            setCatalogHasMore(hasMore);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    }, [
        catalogHasMore,
        loadingMore,
        loading,
        location.pathname,
        fieldsFilter,
        debouncedSearch,
        sortFields,
        onlyFavorites,
        onlyMine,
        onlyMyCheckouts,
        onlyRecents,
    ]);

    const fetchContentRef = useRef(resetCatalog);
    fetchContentRef.current = resetCatalog;
    useEffect(() => {
        return subscribeContentCheckoutSync(() => {
            void fetchContentRef.current();
        });
    }, []);

    useEffect(() => {
        void resetCatalog();
    }, [resetCatalog]);

    useEffect(() => {
        setEntries((prev) => {
            if (prev.length === 0) return prev;
            return prev.map((e) =>
                getContentEntryFromRow(
                    e.item as ContentListRow,
                    employee,
                    employeeMap,
                ),
            );
        });
    }, [employee, employeeMap]);
    useEffect(() => {
        void fetchTagList();
    }, [])

    // Delete content
    async function handleDelete(entry: CardEntry) {
        const res = await fetch(`${apiBase}/api/content/${entry.item.id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error("Delete failed");
        }
        fetchContentRef.current();
        notifyContentCheckoutSync();
        if (
            tutorial?.routeIsTutorial &&
            tutorial.tutorialDocId === entry.item.id
        ) {
            tutorial.finishTutorialAfterDelete();
        }
    }

    const [favoritedList, setFavoritedList] = useState<ContentListRow[]>([])

    // All favorites for logged in user
    const fetchFavorites = useCallback(async () => {
        const result = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/favorites`, {
            credentials: "include",
        })
        if (!result.ok) {
            setFavoritedList([]);
            return;
        }
        const res = await result.json()
        setFavoritedList(res)
    }, []);
    useEffect(() => {
        void fetchFavorites()
    }, [fetchFavorites])

    const bulkFavoriteSelected = useCallback(async () => {
        if (selectedIds.size === 0) return;
        setBulkActionLoading(true);
        try {
            const base = import.meta.env.VITE_BACKEND_URL;
            for (const id of selectedIds) {
                if (favoritedList.some((f) => f.id === id)) continue;
                await fetch(`${base}/api/favorites/${id}`, {
                    method: "POST",
                    credentials: "include",
                });
            }
            await fetchFavorites();
        } finally {
            setBulkActionLoading(false);
            exitSelectMode();
        }
    }, [selectedIds, favoritedList, fetchFavorites, exitSelectMode]);

    const { getEmployeeIsAdmin } = useGetEmployeeIsAdmin();

    const bulkCheckoutSelected = useCallback(async () => {
        if (selectedIds.size === 0 || !employee) return;
        setBulkActionLoading(true);
        try {
            let anyOk = false;
            for (const id of selectedIds) {
                const raw = entries.find((e) => e.item.id === id);
                if (!raw) continue;
                const item = raw.item as ContentWithCheckout;
                const canModify =
                    item.jobPositions.includes(employee.jobPosition) ||
                    getEmployeeIsAdmin(employee);
                if (!canModify) continue;
                //TODO pull from tutorial repository when isTutorial flag is true
                const res = await fetch(`${apiBase}/api/content/checkout/${id}`, {
                    method: "POST",
                    credentials: "include",
                });
                if (res.ok) anyOk = true;
            }
            if (anyOk) notifyContentCheckoutSync();
            fetchContentRef.current();
        } finally {
            setBulkActionLoading(false);
            exitSelectMode();
        }
    }, [selectedIds, employee, entries, exitSelectMode, getEmployeeIsAdmin]);

    const bulkCheckinSelected = useCallback(async () => {
        if (selectedIds.size === 0 || !employee) return;
        setBulkActionLoading(true);
        try {
            let anyOk = false;
            for (const id of selectedIds) {
                const res = await fetch(`${apiBase}/api/content/checkin/${id}`, {
                    method: "POST",
                    credentials: "include",
                });
                if (res.ok) anyOk = true;
            }
            if (anyOk) notifyContentCheckoutSync();
            fetchContentRef.current();
        } finally {
            setBulkActionLoading(false);
            exitSelectMode();
        }
    }, [selectedIds, employee, exitSelectMode]);

    const selectAllFiltered = useCallback(() => {
        if (bulkActionLoading) return;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const ent of entries) {
                next.add(ent.item.id);
            }
            return next;
        });
    }, [bulkActionLoading, entries]);

    const closeFullscreen = useCallback(() => {
        setFullscreenDoc(null);
    }, []);

    const hasActiveFilterOrSearch = useMemo(() => {
        if (searchPhrase.trim() !== "") return true;
        return !contentFiltersEqualToBaseline(fieldsFilter, defaultFieldsFilter);
    }, [searchPhrase, fieldsFilter, defaultFieldsFilter]);

    const showFavoritesSection =
        !onlyRecents &&
        !onlyFavorites &&
        !onlyMine &&
        !onlyMyCheckouts &&
        !hasActiveFilterOrSearch;

    const tutorialHighlightEntryId = useMemo((): number | null => {
        if (!tutorial?.routeIsTutorial || tutorial.tutorialDocId == null) {
            return null;
        }
        const id = tutorial.tutorialDocId;
        const highlightTutorialDocumentRow =
            tutorial.phase === "my_content_loading" ||
            tutorial.phase === "my_content_checkout" ||
            tutorial.phase === "checked_out_loading" ||
            tutorial.phase === "checked_out_edit" ||
            tutorial.phase === "checked_out_delete";
        return highlightTutorialDocumentRow ? id : null;
    }, [
        tutorial?.routeIsTutorial,
        tutorial?.phase,
        tutorial?.tutorialDocId,
    ]);

    const myContentTutorialRefetchDoneRef = useRef(false);
    useEffect(() => {
        if (tutorial?.phase !== "my_content_loading") {
            myContentTutorialRefetchDoneRef.current = false;
        }
    }, [tutorial?.phase]);

    /** After saving in the tutorial, jump ahead by loading this row immediately (small GET vs full My content list). */
    useEffect(() => {
        if (!tutorial?.routeIsTutorial || !onlyMine) return;
        if (!/\/tutorial\/my-documents\/?$/.test(location.pathname)) return;
        if (
            tutorial.phase !== "my_content_loading" ||
            tutorial.tutorialDocId == null
        )
            return;
        fetchContentById(tutorial.tutorialDocId);
    }, [
        tutorial?.routeIsTutorial,
        tutorial?.phase,
        tutorial?.tutorialDocId,
        onlyMine,
        location.pathname,
        fetchContentById,
    ]);

    useEffect(() => {
        if (!tutorial?.routeIsTutorial || !onlyMine) return;
        if (!/\/tutorial\/my-documents\/?$/.test(location.pathname)) return;
        if (
            tutorial.phase !== "my_content_loading" ||
            tutorial.tutorialDocId == null
        )
            return;

        const id = tutorial.tutorialDocId;
        if (entries.some((e) => e.item.id === id)) {
            tutorial.notifyTutorialMyContentListReady();
            return;
        }

        // Avoid firing extra refetches before the initial catalog request has produced any rows.
        if (loading && entries.length === 0) return;

        if (!myContentTutorialRefetchDoneRef.current) {
            myContentTutorialRefetchDoneRef.current = true;
            fetchContentRef.current();
        }
    }, [
        tutorial,
        onlyMine,
        location.pathname,
        loading,
        entries,
    ]);

    const checkedOutTutorialRefetchDoneRef = useRef(false);
    useEffect(() => {
        if (tutorial?.phase !== "checked_out_loading") {
            checkedOutTutorialRefetchDoneRef.current = false;
        }
    }, [tutorial?.phase]);

    useEffect(() => {
        if (!tutorial?.routeIsTutorial || !onlyMyCheckouts) return;
        if (!/\/tutorial\/checked-out\/?$/.test(location.pathname)) return;
        if (
            tutorial.phase !== "checked_out_loading" ||
            tutorial.tutorialDocId == null
        )
            return;
        fetchContentById(tutorial.tutorialDocId);
    }, [
        tutorial?.routeIsTutorial,
        tutorial?.phase,
        tutorial?.tutorialDocId,
        onlyMyCheckouts,
        location.pathname,
        fetchContentById,
    ]);

    useEffect(() => {
        if (!tutorial?.routeIsTutorial || !onlyMyCheckouts) return;
        if (!/\/tutorial\/checked-out\/?$/.test(location.pathname)) return;
        if (
            tutorial.phase !== "checked_out_loading" ||
            tutorial.tutorialDocId == null
        )
            return;

        const id = tutorial.tutorialDocId;
        if (entries.some((e) => e.item.id === id)) {
            tutorial.notifyTutorialCheckedOutListReady();
            return;
        }

        if (loading && entries.length === 0) return;

        if (!checkedOutTutorialRefetchDoneRef.current) {
            checkedOutTutorialRefetchDoneRef.current = true;
            fetchContentRef.current();
        }
    }, [
        tutorial,
        onlyMyCheckouts,
        location.pathname,
        loading,
        entries,
    ]);

    const formOfTypeProps: FormOfTypeProps = useMemo(() => {
        const onAllDocsPath =
            /\/(documents|tutorial)\/all\/?$/.test(location.pathname);

        const tutorialDocument =
            tutorial?.routeIsTutorial &&
            tutorial.phase === "form" &&
            onAllDocsPath &&
            employee
                ? {
                      uploadAsTutorial: true,
                      showFieldCallouts: true,
                      prefill: (() => {
                          const exp = new Date();
                          exp.setFullYear(exp.getFullYear() + 1);
                          return {
                              name: "Tutorial example document",
                              contentType: "workflow",
                              jobPositions: employee.jobPosition
                                  ? [employee.jobPosition]
                                  : [],
                              expirationDate: exp,
                              sourceType: "link" as const,
                              link: "https://example.com",
                              file: null,
                          };
                      })(),
                  }
                : undefined;

        return {
            formType: "Document" as const,
            onCancel: () => fetchContentRef.current(),
            defaultItem: {
                contentType: contentType,
            },
            onTutorialDialogOpenChange: tutorial?.routeIsTutorial
                ? tutorial.notifyAddDialogOpen
                : undefined,
            documentTutorial: tutorialDocument,
            onTutorialDocumentCreated:
                tutorial?.routeIsTutorial && tutorialDocument
                    ? tutorial.notifyTutorialDocumentCreated
                    : undefined,
        };
    }, [
        location.pathname,
        tutorial,
        employee,
        contentType,
    ]);
    const formAddButton = <FormAddButton {...formOfTypeProps}/>;

    const toolbarCenterSlot = selectMode ? (
        bulkActionLoading ? (
            <span
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                aria-live="polite"
            >
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Processing…
            </span>
        ) : (
            <span className="tabular-nums text-sm text-muted-foreground">{selectedIds.size} selected</span>
        )
    ) : undefined;

    const documentsToolbarExtras: React.ReactNode[] = selectMode
        ? [
              <Button
                  key="select-all-filtered"
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={bulkActionLoading || entries.length === 0}
                  onClick={selectAllFiltered}
              >
                  Select all
              </Button>,
              <Button
                  key="favorite-all"
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={bulkActionLoading || selectedIds.size === 0}
                  onClick={() => void bulkFavoriteSelected()}
              >
                  Favorite all
              </Button>,
              onlyMyCheckouts ? (
                  <Button
                      key="check-all-in"
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={bulkActionLoading || selectedIds.size === 0}
                      onClick={() => void bulkCheckinSelected()}
                  >
                      Check all in
                  </Button>
              ) : (
                  <Button
                      key="check-all-out"
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={bulkActionLoading || selectedIds.size === 0}
                      onClick={() => void bulkCheckoutSelected()}
                  >
                      Check all out
                  </Button>
              ),
              <Button
                  key="cancel-select"
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  onClick={exitSelectMode}
              >
                  Cancel
              </Button>,
          ]
        : [
              <Button
                  key="select-entry"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectMode(true)}
              >
                  Select
              </Button>,
          ];

    const isFavorited = useCallback(
        (entry: CardEntry) => favoritedList.some((f) => f.id === entry.item.id),
        [favoritedList],
    );

    const onToggleFavorite = useCallback(
        async (entry: CardEntry) => {
            const id = entry.item.id;
            const base = import.meta.env.VITE_BACKEND_URL;
            const wasFavorited = favoritedList.some((f) => f.id === id);
            try {
                await fetch(`${base}/api/favorites/${id}`, {
                    method: wasFavorited ? "DELETE" : "POST",
                    credentials: "include",
                });
                fetchFavorites();
            } catch (err) {
                console.error("Toggle favorite failed", err);
            }
        },
        [favoritedList, fetchFavorites],
    );

    const listColumnOptions = useMemo(
        () => ({
            renderTitleCell(entry: CardEntry) {
                const item = entry.item as ContentWithCheckout;
                if (!item.isCheckedOut) return entry.title;
                if (employee && item.checkedOutById === employee.id) return entry.title;
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
            selectMode,
            isEntrySelected,
            onToggleEntrySelect,
            isFavorited,
            onToggleFavorite,
        }),
        [employee, selectMode, isEntrySelected, onToggleEntrySelect, isFavorited, onToggleFavorite],
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
                <TagsOption
                    contentId={item.id}
                    filePath={item.filePath}
                    tagIds={entry.tags ? entry.tags.map((tag: Tag) => tag.id) : []}
                    tagList={tagList}
                    isAdmin={employee?.jobPosition === "admin"}
                    contentTagsUpdated={() => {
                        void fetchContentById(item.id) // only this content got changed
                    }}
                    tagsModified={() => {
                        fetchContentRef.current() // maybe other content had their tags changed
                        void fetchTagList() // update list
                    }}
                />
                <ContentReviewsOption
                    content={item}
                    contentReviewsUpdated={() => {
                        void fetchContentById(item.id) // only this content got changed
                    }}
                />
                <ContentDetailsOption
                    content={item}
                    tags={entry.tags}
                />
            </>
            const isJobPosition = employee && item.jobPositions.includes(employee.jobPosition);
            const isAdmin = employee && getEmployeeIsAdmin(employee);
            const canModify = Boolean(isJobPosition || isAdmin);
            const heldByMe =
                Boolean(employee) &&
                item.isCheckedOut === true &&
                item.checkedOutById === employee!.id;
            const checkedOutByOther =
                item.isCheckedOut === true &&
                Boolean(employee) &&
                item.checkedOutById !== employee!.id;

            const editError = canModify ? null : "You do not have authorization to edit this content."
            const deleteError = canModify ? null : "You do not have authorization to delete this content."

            const documentCheckout: DocumentCheckoutOptions = {
                checkedOutByOther,
                heldByMe,
                canAttemptCheckout: canModify,
                onCheckout: async () => {
                    const res = await fetch(`${apiBase}/api/content/checkout/${item.id}`, {
                        method: "POST",
                        credentials: "include",
                    });
                    const ok = res.ok;
                    if (ok) {
                        notifyContentCheckoutSync();
                        if (
                            tutorial?.routeIsTutorial &&
                            tutorial.phase === "my_content_checkout" &&
                            tutorial.tutorialDocId === item.id
                        ) {
                            tutorial.notifyTutorialDocumentCheckedOut();
                        }
                    }
                    return ok;
                },
                onCheckin: () => {
                    void fetch(`${apiBase}/api/content/checkin/${item.id}`, {
                        method: "POST",
                        credentials: "include",
                    }).finally(() => {
                        fetchContentRef.current();
                        notifyContentCheckoutSync();
                    });
                },
            }
            const tutorialDeleteOnly =
                tutorial?.routeIsTutorial &&
                tutorial.phase === "checked_out_delete" &&
                tutorial.tutorialDocId === item.id;

            return (
                <ModifyDropdown
                    entry={entry}
                    trigger={trigger}
                    {...formOfTypeProps}
                    handleDelete={handleDelete}
                    extraMenuItems={extraMenuItems}
                    editError={editError}
                    deleteError={deleteError}
                    documentCheckout={documentCheckout}
                    tutorialDeleteOnly={Boolean(tutorialDeleteOnly)}
                    tutorialEditTooltip="Here you can edit documents and delete."
                />
            );
        }

    const showContentTypeBadge = useMemo(() => {
        const types = new Set(
            entries.map((e) => (e.item as Content).contentType),
        );
        return types.size > 1;
    }, [entries]);
    const showJobPositionBadge = useMemo(() => {
        const positions = new Set(
            entries.flatMap((e) => (e.item as Content).jobPositions),
        );
        return positions.size > 1;
    }, [entries]);

    const sortByMap = {
        ...(onlyRecents ? {["lastViewedAt"]: "Last Viewed At"} : {}),
        ...CONTENT_SORT_BY_MAP
    }

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
            tagList: tagList,
        },
        sortButtonProps: {
            sortByMap: sortByMap,
            defaultSortFields,
            sortFields,
            setSortFields,
        }
    }

    const gridSkeletonCount =
        loading && entries.length === 0
            ? SKELETON_GRID_SLOTS
            : null;

    const favoritedQueryEntries = useMemo(() => {
        if (favoritedList.length === 0) return [];
        return favoritedList.map((f) =>
            getContentEntryFromRow(f, employee, employeeMap),
        );
    }, [favoritedList, employee, employeeMap]);

    const favoritesThumbnailChunkSizes = useMemo(
        () => toChunkSizes(favoritedQueryEntries.length, THUMBNAIL_CHUNK_SIZE),
        [favoritedQueryEntries.length],
    );

    const catalogInfiniteScrollProps = useMemo(
        () => ({
            hasMore: catalogHasMore,
            loadingMore,
            onLoadMore: loadMoreCatalog,
        }),
        [catalogHasMore, loadingMore, loadMoreCatalog],
    );

    const { view, setView } = useMainContext();
    const viewSelectorButtonProps: ViewSelectorButtonProps = { view, setView };

    const embeddedContentClassName =
        "flex flex-col flex-1 min-h-0 overflow-auto px-1 pb-0 pt-3";

    if (splitMode) {
        const leftPaneEntryPage = (
            <EntryPage
                key="split-left-grid"
                entries={entries}
                displayedEntryLabels={{ one: "document", other: "documents" }}
                showFavoritesSection={showFavoritesSection}
                favoritedEntries={favoritedQueryEntries}
                gridSkeletonCount={gridSkeletonCount}
                thumbnailChunkSizes={thumbnailChunkSizes}
                favoritesThumbnailChunkSizes={favoritesThumbnailChunkSizes}
                catalogInfiniteScroll={catalogInfiniteScrollProps}
                catalogHasMore={catalogHasMore}
                createOptionsElement={createOptionsElement}
                listColumnOptions={listColumnOptions}
                tutorialHighlightEntryId={tutorialHighlightEntryId}
                selectMode={selectMode}
                isEntrySelected={isEntrySelected}
                onToggleEntrySelect={onToggleEntrySelect}
                onMarqueeSelect={onMarqueeSelect}
                marqueeBlocked={bulkActionLoading}
                onDocumentRowContextMenu={openDocumentMenuFromRow}
                onListRowClick={wrapRowOpen(openDocInLeftPane)}
                omitToolbar
                contentClassName={embeddedContentClassName}
                cardGridProps={{
                    renderCard: (state) => (
                        <ContentCard
                            key={state.entry.item.id}
                            onView={openDocInLeftPane}
                            showContentTypeBadge={showContentTypeBadge}
                            showJobPositionBadge={showJobPositionBadge}
                            viewerEmployeeId={employee?.id ?? null}
                            tutorialSeeDocHighlight={
                                tutorialHighlightEntryId != null &&
                                state.entry.item.id === tutorialHighlightEntryId
                            }
                            {...state}
                            onOpen={onContentOpened}
                        />
                    ),
                }}
                queryProps={queryProps}
            />
        );
        const rightPaneEntryPage = (
            <EntryPage
                key="split-right-grid"
                entries={entries}
                displayedEntryLabels={{ one: "document", other: "documents" }}
                showFavoritesSection={showFavoritesSection}
                favoritedEntries={favoritedQueryEntries}
                gridSkeletonCount={gridSkeletonCount}
                thumbnailChunkSizes={thumbnailChunkSizes}
                favoritesThumbnailChunkSizes={favoritesThumbnailChunkSizes}
                catalogInfiniteScroll={catalogInfiniteScrollProps}
                catalogHasMore={catalogHasMore}
                createOptionsElement={createOptionsElement}
                listColumnOptions={listColumnOptions}
                tutorialHighlightEntryId={tutorialHighlightEntryId}
                selectMode={selectMode}
                isEntrySelected={isEntrySelected}
                onToggleEntrySelect={onToggleEntrySelect}
                onMarqueeSelect={onMarqueeSelect}
                marqueeBlocked={bulkActionLoading}
                onDocumentRowContextMenu={openDocumentMenuFromRow}
                onListRowClick={wrapRowOpen(openDocInRightPane)}
                omitToolbar
                contentClassName={embeddedContentClassName}
                cardGridProps={{
                    renderCard: (state) => (
                        <ContentCard
                            key={state.entry.item.id}
                            onView={openDocInRightPane}
                            showContentTypeBadge={showContentTypeBadge}
                            showJobPositionBadge={showJobPositionBadge}
                            viewerEmployeeId={employee?.id ?? null}
                            tutorialSeeDocHighlight={
                                tutorialHighlightEntryId != null &&
                                state.entry.item.id === tutorialHighlightEntryId
                            }
                            {...state}
                            onOpen={onContentOpened}
                        />
                    ),
                }}
                queryProps={queryProps}
            />
        );
        return (
            <div className="bg-muted/50 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl pt-2">
                <Toolbar
                    toolbarCenterSlot={toolbarCenterSlot}
                    extraElements={[
                        ...documentsToolbarExtras,
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
                contentId={fullscreenDoc.contentId}
                url={fullscreenDoc.url}
                filename={fullscreenDoc.filename}
                title={fullscreenDoc.title}
                onClose={closeFullscreen}
                canEnterSplit={canEnterSplit}
                onEnterSplit={canEnterSplit ? enterSplitFromFullscreen : undefined}
                onDownload={() => {
                    fetch(`${apiBase}/api/content/${fullscreenDoc.contentId}/download`, {
                        credentials: "include",
                    });
                }}
            />
        );
    }

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <EntryPage
                entries={entries}
                displayedEntryLabels={{ one: "document", other: "documents" }}
                showFavoritesSection={showFavoritesSection}
                favoritedEntries={favoritedQueryEntries}
                gridSkeletonCount={gridSkeletonCount}
                thumbnailChunkSizes={thumbnailChunkSizes}
                favoritesThumbnailChunkSizes={favoritesThumbnailChunkSizes}
                catalogInfiniteScroll={catalogInfiniteScrollProps}
                catalogHasMore={catalogHasMore}
                createOptionsElement={createOptionsElement}
                listColumnOptions={listColumnOptions}
                tutorialHighlightEntryId={tutorialHighlightEntryId}
                selectMode={selectMode}
                isEntrySelected={isEntrySelected}
                onToggleEntrySelect={onToggleEntrySelect}
                onMarqueeSelect={onMarqueeSelect}
                marqueeBlocked={bulkActionLoading}
                onDocumentRowContextMenu={openDocumentMenuFromRow}
                onListRowClick={wrapRowOpen(handleViewFullscreen)}
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
                            viewerEmployeeId={employee?.id ?? null}
                            tutorialSeeDocHighlight={
                                tutorialHighlightEntryId != null &&
                                state.entry.item.id === tutorialHighlightEntryId
                            }
                            {...state}
                            onOpen={onContentOpened}
                        />
                    )),
                }}
                extraToolbarElements={[
                    ...documentsToolbarExtras,
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
                toolbarCenterSlot={toolbarCenterSlot}
                queryProps={queryProps}
            />
            <SplitScreenEdgeAffordance onActivate={enterSplitFromGrid} />
        </div>
    );
}
