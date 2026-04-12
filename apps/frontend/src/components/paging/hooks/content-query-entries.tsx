// From content entries, applies a query to show content searched for

import {useCallback} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import type {ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import useQueryEntries from "@/components/paging/hooks/query-entries.tsx";

type ContentQueryEntriesProps = {
    entries: CardEntry[];
    searchPhrase: string;
    fieldsFilter: ContentFieldsFilter;
}
export default function useContentQueryEntries({
                                                   entries,
                                                   searchPhrase,
                                                   fieldsFilter,
}: ContentQueryEntriesProps) {
    console.log("entries ", entries);
    const getFieldsFilterEntries = useCallback((from: CardEntry[]) => {
        return from.filter(entry => {
            const c = entry.item as Content
            const matchContentType = (
                fieldsFilter.contentTypes.length === 0 ||
                fieldsFilter.contentTypes.some((type) => c.contentType === type)
            )
            if (!matchContentType) {
                return false;
            }
            const matchJobPosition = (
                fieldsFilter.jobPositions.length === 0 ||
                fieldsFilter.jobPositions.some((position) => c.jobPosition === position)
            )
            return matchJobPosition;
        })
    }, [fieldsFilter])

    // Track queried entries
    return useQueryEntries({
        entries,
        searchPhrase,
        mapEntries: getFieldsFilterEntries
    })
}