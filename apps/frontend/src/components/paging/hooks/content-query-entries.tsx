// From content entries, applies a query to show content searched for

import {useCallback} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import type {ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import useQueryEntries from "@/components/paging/hooks/query-entries.tsx";

// TODO put in utils (copied from ContentCard, trying not to modify cards rn)
function isSupabasePath(link: string) {
    return !link.startsWith("http://") && !link.startsWith("https://");
}

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
    const getFieldsFilterEntries = useCallback((from: CardEntry[]) => {
        return from.filter(entry => {
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
                fieldsFilter.jobPositions.some((position) => c.jobPosition === position)
            )
            if (!matchJobPosition) {
                return false;
            }
            const matchDocumentTypes = (
                !fieldsFilter.documentTypes || fieldsFilter.documentTypes.length === 0 ||
                fieldsFilter.documentTypes.some((type) => (
                    (type == "links" && c.link && !isSupabasePath(c.link)) ||
                    (type == "files" && c.link && isSupabasePath(c.link))
                ))
            )
            return matchDocumentTypes;
        })
    }, [fieldsFilter])

    // Track queried entries
    return useQueryEntries({
        entries,
        searchPhrase,
        mapEntries: getFieldsFilterEntries
    })
}