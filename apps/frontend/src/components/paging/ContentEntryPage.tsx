// ContentEntryPage used for Workflow/Reference/Tools pages
// It makes an EntryPage with Card + List view showing all content
// A specific type can be specified (workflow, reference, tool) to only show that type of content

import {useEffect, useMemo, useState} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import * as React from "react";
import EntryPage from "@/components/paging/EntryPage.tsx";
import ContentCard from "@/components/cards/ContentCard.tsx";
import FormAddButton from "@/components/forms/FormAddButton.tsx";
import ModifyDropdown from "@/components/paging/ModifyDropdown.tsx";
import DocumentViewer from "@/components/DocumentViewer.tsx";
import type {FormOfTypeProps} from "@/components/forms/FormOfType.tsx";
import FilterDocumentFields, {type ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";
import useContentQueryEntries from "@/components/paging/hooks/content-query-entries.tsx";
import {DropdownMenuItem} from "@/components/DropdownMenu.tsx";
import {CheckCircleIcon, ClockIcon, CircleIcon} from "@phosphor-icons/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx";

type ViewerState = {
    url: string;
    filename: string;
    title: string;
    contentId?: number;
};


type DocumentScope = "all" | "workflow" | "reference" | "tool";

type ContentEntryPageProps = {
    contentType?: string;
    /** Toolbar dropdown to switch between all types and each document type; uses `/documents/all`. */
    showContentTypeSelector?: boolean;
}
type Employee = {
    id: number;
    firstName: string;
    lastName: string;
};

/** Fixed grid of placeholders while the first content request is in flight. */
const SKELETON_GRID_SLOTS = 25;

export default function ContentEntryPage({
                                             contentType,
                                             showContentTypeSelector,
}: ContentEntryPageProps) {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewerItem, setViewerItem] = useState<ViewerState | null>(null);
    const [employeeMap, setEmployeeMap] = useState<Map<number, string>>(new Map());

    async function handleView(entry: CardEntry) {
        const id = entry.item.id;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${id}/download`, {
            credentials: "include",
        });
        if (!res.ok) return;
        const { url } = await res.json();
        const filename = entry.link.split("/").pop() ?? entry.title;
        setViewerItem({ url, filename, title: entry.title, contentId: id });
    }

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employees`, { credentials: "include" })
            .then(res => res.json())
            .then((employees: Employee[]) => {
                setEmployeeMap(new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`])));
            })
            .catch(() => {});
    }, []);

    // This gets all content for the signed-in user
    function fetchContent() {
        const isInitialLoad = entries.length === 0;
        if (isInitialLoad) setLoading(true);

        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content`, { credentials: "include" })
            .then((res) => res.json())
            .then((data: Content[]) => {
                const mapped: CardEntry[] = data.map((item) => ({
                    item: item,
                    title: item.title,
                    link: item.link,
                    description: employeeMap.get((item as Content & { ownerId: number }).ownerId) ?? item.ownerName,
                    badge: item.contentType,
                }));
                setEntries(mapped);
            })
            .finally(() => {
                if (isInitialLoad) setLoading(false);
            });
    }
    useEffect(() => {
        fetchContent()
    }, [employeeMap]);

    // Delete content
    async function handleDelete(entry: CardEntry) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${entry.item.id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error("Delete failed");
        }
        fetchContent()
    }

    const [documentScope, setDocumentScope] = useState<DocumentScope>("all");

    // Use Document form with default content type
    const formOfTypeProps: FormOfTypeProps = {
        formType: "Document",
        onCancel: fetchContent,
        defaultItem: {
            contentType: showContentTypeSelector
                ? (documentScope === "all" ? undefined : documentScope)
                : contentType,
        },
    }

    const documentScopeSelect = showContentTypeSelector ? (
        <Select
            value={documentScope}
            onValueChange={(v) => setDocumentScope(v as DocumentScope)}
        >
            <SelectTrigger className="w-[168px]" size="sm" aria-label="Document category">
                <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All documents</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="tool">Tools</SelectItem>
            </SelectContent>
        </Select>
    ) : null;

    // Create toolbar button for Add Document Form
    const formAddButton = <FormAddButton {...formOfTypeProps}/>

    // Update status for workflow documents via PATCH
    async function handleStatusChange(entry: CardEntry, status: string) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${entry.item.id}/status`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        fetchContent();
    }

    // Make card "..." show dropdown to modify documents
    const createOptionsElement =
        (entry: CardEntry, trigger: React.ReactNode) => {
            const item = entry.item as Content & { ownerId: number };
            const extraMenuItems = item.contentType === "workflow" ? (
                <>
                    {item.status !== "to-do" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(entry, "to-do")}>
                            <CircleIcon />
                            Mark Todo
                        </DropdownMenuItem>
                    )}
                    {item.status !== "in-progress" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(entry, "in-progress")}>
                            <ClockIcon />
                            Mark In Progress
                        </DropdownMenuItem>
                    )}
                    {item.status !== "completed" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(entry, "completed")}>
                            <CheckCircleIcon />
                            Mark Complete
                        </DropdownMenuItem>
                    )}
                </>
            ) : undefined;

            return ModifyDropdown({
                entry,
                trigger,
                ...formOfTypeProps,
                handleDelete: handleDelete,
                extraMenuItems,
            });
        }

    const defaultFieldsFilterFixed = useMemo((): ContentFieldsFilter => (
        contentType ? { contentTypes: [contentType], jobPositions: [] } : {}
    ), [contentType]);

    const defaultFieldsFilterSelector = useMemo((): ContentFieldsFilter => ({
        ...(documentScope === "all" ? {} : { contentTypes: [documentScope] }),
        jobPositions: [],
    }), [documentScope]);

    const defaultFieldsFilter = showContentTypeSelector
        ? defaultFieldsFilterSelector
        : defaultFieldsFilterFixed;

    const [fieldsFilter, setFieldsFilter] = useState<ContentFieldsFilter>(() => {
        if (showContentTypeSelector) return {};
        return contentType ? { contentTypes: [contentType], jobPositions: [] } : {};
    });

    useEffect(() => {
        if (!showContentTypeSelector) return;
        setFieldsFilter((prev) => ({
            ...prev,
            contentTypes: documentScope === "all" ? [] : [documentScope],
        }));
    }, [documentScope, showContentTypeSelector]);
    const [searchPhrase, setSearchPhrase] = useState("")
    const queryEntries = useContentQueryEntries({
        entries,
        searchPhrase,
        fieldsFilter,
    })

    const showContentTypeBadge = useMemo(() => {
        const types = new Set(
            queryEntries.map((e) => (e.item as Content).contentType),
        );
        return types.size > 1;
    }, [queryEntries]);

    // Track properties to update querying
    const queryProps: QueryProps<ContentFieldsFilter> = {
        searchBarProps: {
            setFilter: setSearchPhrase
        },
        filterButtonProps: {
            emptyFieldsFilter: {},
            defaultFieldsFilter,
            fieldsFilter,
            setFieldsFilter,
            createFieldsElement: (props) => (
                <FilterDocumentFields
                    {...props}
                    hideContentType={showContentTypeSelector}
                />
            ),
        },
        sortButtonProps: {}
    }

    if (viewerItem) {
        return (
            <DocumentViewer
                url={viewerItem.url}
                filename={viewerItem.filename}
                title={viewerItem.title}
                contentId={viewerItem.contentId}
                onClose={() => setViewerItem(null)}
            />
        );
    }

    const gridSkeletonCount =
        loading && entries.length === 0 ? SKELETON_GRID_SLOTS : null;

    return (
        <EntryPage
            entries={queryEntries}
            gridSkeletonCount={gridSkeletonCount}
            createOptionsElement={createOptionsElement}
            onListRowClick={handleView}
            cardGridProps={{
                renderCard: ((state) => (
                    // Uses content card for grid
                    <ContentCard
                        key={state.entry.item.id}
                        onView={handleView}
                        showContentTypeBadge={showContentTypeBadge}
                        {...state}
                    />
                )),
            }}
            extraToolbarElements={[documentScopeSelect, formAddButton].filter(Boolean)}
            queryProps={queryProps}
        />
    )
}
