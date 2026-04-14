import {EMPLOYEE_SORT_BY_MAP} from "@/components/input/constants.tsx";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Content, Employee} from "db";
import useSortFunction, {type SortFieldsProps, type SortFunction} from "@/components/paging/hooks/sort-function.tsx";

export type EmployeeSortFunction = (from: CardEntry[]) => CardEntry[]
export type EmployeeSortBy = keyof typeof EMPLOYEE_SORT_BY_MAP


type EmployeeSortFunctionProps = SortFieldsProps
export default function useEmployeeSortFunction(props: EmployeeSortFunctionProps): SortFunction {
    return useSortFunction({
        getMapper: (sortBy: EmployeeSortBy)=> {
            if (sortBy === "jobPosition") {
                return (entry) => (entry.item as Employee).jobPosition
            }
            else if (sortBy === "dateOfBirth") {
                return (entry) => (entry.item as Employee).dateOfBirth.toString()
            }
            return
        },
        ...props
    })
}