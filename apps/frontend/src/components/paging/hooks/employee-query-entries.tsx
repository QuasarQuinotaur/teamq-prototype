// From employee entries, applies a query to show employees searched for

import {useCallback} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Employee} from "db";
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
        return from
    }, [])

    // Track queried entries
    return useQueryEntries({
        entries,
        searchPhrase,
        mapEntries: getFieldsFilterEntries
    })
}