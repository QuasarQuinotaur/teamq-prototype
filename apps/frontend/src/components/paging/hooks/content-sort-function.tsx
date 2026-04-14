import {useMemo} from "react";
import {CONTENT_SORT_BY_MAP} from "@/components/input/constants.tsx";
import type {Content} from "db";
import useSortFunction, {type SortFieldsProps, type SortFunction} from "@/components/paging/hooks/sort-function.tsx";

export type ContentSortBy = keyof typeof CONTENT_SORT_BY_MAP


type ContentSortFunctionProps = SortFieldsProps
export default function useContentSortFunction(props: ContentSortFunctionProps): SortFunction {
    return useSortFunction({
        getMapper: (sortBy: ContentSortBy)=> {
            if (sortBy === "contentType") {
                return (entry) => (entry.item as Content).contentType
            }
            else if (sortBy === "jobPosition") {
                return (entry) =>
                    [...(entry.item as Content).jobPositions].sort().join(",")
            }
            else if (sortBy === "expirationDate") {
                return (entry) => (entry.item as Content).expirationDate.toString()
            }
            return
        },
        ...props
    })
}