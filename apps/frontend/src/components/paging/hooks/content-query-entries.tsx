// From content entries, applies a query to show content searched for

import {useCallback} from "react";
import useQueryEntries, {type QueryEntriesProps} from "@/components/paging/hooks/query-entries.tsx";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import type {ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import type {SortFunction} from "@/components/paging/hooks/sort-function.tsx";
import {isSupabasePath} from "@/lib/utils.ts";


type ContentQueryEntriesProps = {
    fieldsFilter: ContentFieldsFilter;
    sortFunction?: SortFunction;
} & QueryEntriesProps;
export default function useContentQueryEntries({
                                                   fieldsFilter,
                                                   sortFunction,
                                                   ...props
}: ContentQueryEntriesProps) {
    const filterEntry = useCallback(entry => {
        const c = entry.item as Content
        const matchContentType = (
            !fieldsFilter.contentTypes || fieldsFilter.contentTypes.length === 0 ||
            fieldsFilter.contentTypes.some((type) => c.contentType === type)
        )
        if (!matchContentType) {
            return false;
        }
        const matchJobPosition = (
            !fieldsFilter.jobPositions || fieldsFilter.jobPositions.length === 0 ||
            fieldsFilter.jobPositions.some((position) => c.jobPositions.includes(position))
        )
        if (!matchJobPosition) {
            return false;
        }
        const path = c.filePath ?? "";
        const matchDocumentTypes = (
            !fieldsFilter.documentTypes || fieldsFilter.documentTypes.length === 0 ||
            fieldsFilter.documentTypes.some((type) => (
                (type == "links" && path && !isSupabasePath(path)) ||
                (type == "files" && path && isSupabasePath(path))
            ))
        )
        return matchDocumentTypes;
    }, [fieldsFilter])
    const mapEntries = useCallback((from: CardEntry[]) => {
        return (sortFunction ? sortFunction(from) : from).filter(filterEntry)
    }, [sortFunction, filterEntry])

    // Track queried entries
    return useQueryEntries({
        ...props,
        mapEntries
    })
}