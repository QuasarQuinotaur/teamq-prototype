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
import {DropdownMenuCheckboxItem} from "@/components/DropdownMenu.tsx";
import {StarIcon} from "@phosphor-icons/react";
import {CONTENT_SORT_BY_MAP} from "@/components/input/constants.tsx";
import useContentSortFunction from "@/components/paging/hooks/content-sort-function.tsx";
import type {SortFields} from "@/components/forms/SortForm.tsx";
import {DEFAULT_SORT_FIELDS} from "@/components/paging/hooks/sort-function.tsx";

type ViewerState = {
    url: string;
    filename: string;
    title: string;
};


type ContentEntryPageProps = {
    /** Leave empty to show all documents: category filter starts empty (show all); use filter panel for categories. */
    contentType?: string;
    onlyFavorites?: boolean;
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
                                             onlyFavorites
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
        const filename =
            entry.link.split("/").pop()?.split("?")[0] ?? entry.title;
        setViewerItem({ url, filename, title: entry.title });
    }

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employee`, { credentials: "include" })
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
                    link: item.filePath ?? "",
                    description:
                        employeeMap.get(item.ownerId) ?? undefined,
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

    const defaultFieldsFilter = useMemo((): ContentFieldsFilter => (
        (contentType ? { contentTypes: [contentType], jobPositions: [] } : {})
    ), [contentType]);
    const [fieldsFilter, setFieldsFilter] = useState<ContentFieldsFilter>(defaultFieldsFilter);
    const defaultSortFields: SortFields = DEFAULT_SORT_FIELDS
    const [sortFields, setSortFields] = useState(defaultSortFields)
    const sortFunction = useContentSortFunction({sortFields})
    const [searchPhrase, setSearchPhrase] = useState("")
    const queryEntries = useContentQueryEntries({
        entries,
        searchPhrase,
        fieldsFilter,
        onlyFavorites,
        sortFunction,
    })

    const formOfTypeProps: FormOfTypeProps = {
        formType: "Document",
        onCancel: fetchContent,
        defaultItem: {
            contentType: contentType,
        },
    };
    const formAddButton = <FormAddButton {...formOfTypeProps}/>;

    // Make card "..." show dropdown to modify documents
    const createOptionsElement =
        (entry: CardEntry, trigger: React.ReactNode) => {
            const item = entry.item as Content & { ownerId: number };
            const favorited = false;
            const extraMenuItems = <>
                <DropdownMenuCheckboxItem
                    checked={favorited}
                    onCheckedChange={(newFavorited) => {
                        console.log("Favorite", item.title, "?", newFavorited)
                    }}
                >
                    <StarIcon weight={favorited ? "fill" : "regular"}/>
                    Favorite
                </DropdownMenuCheckboxItem>
            </>
            // const extraMenuItems = <>
            //
            //     {
            //         item.contentType === "workflow" ? (
            //         <>
            //             <DropdownMenuSeparator />
            //             {item.status !== "to-do" && (
            //                 <DropdownMenuItem onClick={() => handleStatusChange(entry, "to-do")}>
            //                     <CircleIcon />
            //                     Mark Todo
            //                 </DropdownMenuItem>
            //             )}
            //             {item.status !== "in-progress" && (
            //                 <DropdownMenuItem onClick={() => handleStatusChange(entry, "in-progress")}>
            //                     <ClockIcon />
            //                     Mark In Progress
            //                 </DropdownMenuItem>
            //             )}
            //             {item.status !== "completed" && (
            //                 <DropdownMenuItem onClick={() => handleStatusChange(entry, "completed")}>
            //                     <CheckCircleIcon />
            //                     Mark Complete
            //                 </DropdownMenuItem>
            //             )}
            //         </> ) : undefined
            //     }
            // </>

            return ModifyDropdown({
                entry,
                trigger,
                ...formOfTypeProps,
                handleDelete: handleDelete,
                extraMenuItems,
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

    if (viewerItem) {
        return (
            <DocumentViewer
                url={viewerItem.url}
                filename={viewerItem.filename}
                title={viewerItem.title}
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
                        showJobPositionBadge={showJobPositionBadge}
                        {...state}
                    />
                )),
            }}
            extraToolbarElements={[formAddButton]}
            queryProps={queryProps}
        />
    )
}
