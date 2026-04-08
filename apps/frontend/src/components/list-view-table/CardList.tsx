import * as React from "react"
import type { CardEntry } from "@/components/Card.tsx"
import { createColumns } from "./columns.tsx"
import { DataTable } from "./data-table.tsx"

type CardListProps = {
    entries: CardEntry[];
    optionsWrapper?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
}

export default function CardList({ entries, optionsWrapper }: CardListProps) {
    const columns = createColumns(optionsWrapper);

    return (
        <div className="container mx-auto py-4 px-4">
            <DataTable columns={columns} data={entries} />
        </div>
    )
}
