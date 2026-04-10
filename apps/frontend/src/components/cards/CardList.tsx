// Shows a bunch of information using cards in a list

import * as React from "react"
import { createColumns } from "./list-view-table/columns.tsx"
import { DataTable } from "./list-view-table/data-table.tsx"
import type {EntryProps} from "@/components/paging/EntryPage.tsx";

export type CardListProps = object

export default function CardList({
                                     entries,
                                     createOptionsElement
}: CardListProps & EntryProps) {
    const columns = createColumns(createOptionsElement);

    return (
        <div className="container mx-auto py-4 px-4">
            <DataTable columns={columns} data={entries} />
        </div>
    )
}
