import type { ColumnDef } from "@tanstack/react-table"
import type { CardEntry } from "@/components/cards/Card.tsx"
import * as React from "react"

export type CreateColumnsOptions = {
    renderTitleCell?: (entry: CardEntry) => React.ReactNode;
    /** When true, hides the expiration column (documents-only). */
    omitExpiration?: boolean;
};

// Legacy mock type (kept for reference)
// export type Payment = {
//     id: string
//     tag: "Business Analyst" | "Underwriter"
//     name: string
//     link: string
// }

export function createColumns(
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode,
    options?: CreateColumnsOptions,
): ColumnDef<CardEntry>[] {
    const cols: ColumnDef<CardEntry>[] = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => {
                const entry = row.original;
                if (options?.renderTitleCell) {
                    return options.renderTitleCell(entry);
                }
                return entry.title;
            },
        },
        {
            accessorKey: "owner",
            header: "Owner",
        },
    ];

    if (!options?.omitExpiration) {
        cols.push({
            accessorKey: "expirationDate",
            header: "Expiration",
            cell: ({ getValue }) => {
                const value = getValue();

                if (!value) return "—";

                const date = new Date(value as string);

                return date.toLocaleDateString("en-US", {
                    month: "short",   // Apr
                    day: "numeric",   // 2
                    year: "numeric",  // 2026
                });
            },
        });
    }

    cols.push({
        accessorKey: "badge",
        header: "Type",
        cell: ({ row }) => {
            const badge = row.original.badge;
            if (!badge) return null;
            return badge.charAt(0).toUpperCase() + badge.slice(1);
        },
    });

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
