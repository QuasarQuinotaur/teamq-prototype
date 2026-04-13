// From employee entries, applies a query to show employees searched for

import {useCallback} from "react";
import useQueryEntries, {type QueryEntriesProps} from "@/components/paging/hooks/query-entries.tsx";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Employee} from "db";
import type {EmployeeFieldsFilter} from "@/components/paging/toolbar/FilterEmployeeFields.tsx";
import type {SortFunction} from "@/components/paging/hooks/sort-function.tsx";

type EmployeeQueryEntriesProps = {
    fieldsFilter: EmployeeFieldsFilter;
    sortFunction?: SortFunction;
} & QueryEntriesProps;
export default function useEmployeeQueryEntries({
                                                    fieldsFilter,
                                                    sortFunction,
                                                    ...props
}: EmployeeQueryEntriesProps) {
    const filterEntry = useCallback(entry => {
        const e = entry.item as Employee
        const matchJobPosition = (
            !fieldsFilter.jobPositions || fieldsFilter.jobPositions.length === 0 ||
            fieldsFilter.jobPositions.some((position) => e.jobPosition === position)
        )
        return matchJobPosition;
    }, [fieldsFilter])
    const getFieldsFilterEntries = useCallback((from: CardEntry[]) => {
        return (sortFunction ? sortFunction(from) : from).filter(filterEntry)
    }, [sortFunction, filterEntry])


    // Track queried entries
    return useQueryEntries({
        ...props,
        mapEntries: getFieldsFilterEntries
    })
}