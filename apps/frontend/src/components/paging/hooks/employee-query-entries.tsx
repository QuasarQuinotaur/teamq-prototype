// From employee entries, applies a query to show employees searched for

import {useCallback} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content, Employee} from "db";
import type {ContentFieldsFilter} from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import useQueryEntries from "@/components/paging/hooks/query-entries.tsx";
import type {EmployeeFieldsFilter} from "@/components/paging/toolbar/FilterEmployeeFields.tsx";

type ContentQueryEntriesProps = {
    entries: CardEntry[];
    searchPhrase: string;
    fieldsFilter: EmployeeFieldsFilter;
}
export default function useEmployeeQueryEntries({
                                                    entries,
                                                    searchPhrase,
                                                    fieldsFilter,
}: ContentQueryEntriesProps) {
    const getFieldsFilterEntries = useCallback((from: CardEntry[]) => {
        return from.filter(entry => {
            const e = entry.item as Employee
            const matchJobPosition = (
                !fieldsFilter.jobPositions || fieldsFilter.jobPositions.length === 0 ||
                fieldsFilter.jobPositions.some((position) => e.jobPosition === position)
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