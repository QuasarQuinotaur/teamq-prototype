import {useMemo} from "react";
import useSorterMethod from "@/components/paging/hooks/sorter-method.tsx";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {SortFields} from "@/components/forms/SortForm.tsx";

export type SortFunction = (from: CardEntry[]) => CardEntry[]
export type SortFieldsProps = {
    sortFields: SortFields;
}

export const DEFAULT_SORT_FIELDS: SortFields = {
    sortBy: "title",
    sortMethod: "ascending"
}
export const DEFAULT_SORT_FIELDS_RECENT: SortFields = {
    sortBy: "lastViewedAt",
    sortMethod: "ascending"
}

type SortFunctionProps<T> = {
    getMapper: (sortBy: T) => (entry: CardEntry) => string | undefined;
} & SortFieldsProps
export default function useSortFunction<T extends string>({
                                                              sortFields,
                                                              getMapper
}: SortFunctionProps<T>): SortFunction {
    const getSorterMethod = useSorterMethod()
    const sorterMethod = getSorterMethod(sortFields.sortMethod)
    return useMemo(() => {
        const mapper: ((entry: CardEntry) => string) | undefined = getMapper(sortFields.sortBy as T)
        return (from: CardEntry[]) => {
            const titleSorted = from.sort(
                (a, b) => sorterMethod(a.title, b.title)
            )
            return mapper ? titleSorted.sort(
                (a, b) => sorterMethod(mapper(a), mapper(b))
            ) : titleSorted
        };
    }, [getMapper, sortFields, sorterMethod])
}