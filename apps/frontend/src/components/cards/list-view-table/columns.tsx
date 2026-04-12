import type { ColumnDef } from "@tanstack/react-table"
import type { CardEntry } from "@/components/cards/Card.tsx"
import * as React from "react"

// Legacy mock type (kept for reference)
// export type Payment = {
//     id: string
//     tag: "Business Analyst" | "Underwriter"
//     name: string
//     link: string
// }

export function createColumns(
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode
): ColumnDef<CardEntry>[] {
    const cols: ColumnDef<CardEntry>[] = [
        {
            accessorKey: "title",
            header: "Title",
        },
        {
            accessorKey: "description",
            header: "Description",
        },
        {
            accessorKey: "badge",
            header: "Type",
            cell: ({ row }) => {
                const badge = row.original.badge;
                if (!badge) return null;
                return badge.charAt(0).toUpperCase() + badge.slice(1);
            },
        },
    ];

    if (createOptionsElement) {
        cols.push({
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    {createOptionsElement(
                        row.original,
                        <button className="px-2 py-1 text-sm border rounded hover:bg-muted">•••</button>
                    )}
                </div>
            ),
        });
    }

    return cols;
}
