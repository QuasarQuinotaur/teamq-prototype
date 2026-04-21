import type { ColumnDef } from "@tanstack/react-table"
import type { CardEntry } from "@/components/cards/Card.tsx"
import * as React from "react"

function DocumentActionsMenuCell({
    entry,
    createOptionsElement,
}: {
    entry: CardEntry
    createOptionsElement: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode
}) {
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    return (
        <div
            data-row-click-ignore
            className="flex justify-end"
            onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                triggerRef.current?.click()
            }}
        >
            {createOptionsElement(
                entry,
                <button
                    ref={triggerRef}
                    type="button"
                    data-document-menu-trigger={entry.item.id}
                    className="rounded border px-2 py-1 text-sm hover:bg-muted"
                >
                    •••
                </button>,
            )}
        </div>
    )
}

export type CreateColumnsOptions = {
    renderTitleCell?: (entry: CardEntry) => React.ReactNode;
    /** When true, hides the expiration column (documents-only). */
    omitExpiration?: boolean;
    selectMode?: boolean;
    isEntrySelected?: (entry: CardEntry) => boolean;
    onToggleEntrySelect?: (entry: CardEntry) => void;
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
    const cols: ColumnDef<CardEntry>[] = [];

    if (options?.selectMode && options.isEntrySelected && options.onToggleEntrySelect) {
        cols.push({
            id: "select",
            header: "",
            size: 36,
            cell: ({ row }) => {
                const entry = row.original;
                const checked = options.isEntrySelected!(entry);
                return (
                    <div data-row-click-ignore className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="size-4 rounded border-input accent-primary"
                            checked={checked}
                            onChange={() => options.onToggleEntrySelect!(entry)}
                            aria-label={checked ? "Deselect row" : "Select row"}
                        />
                    </div>
                );
            },
        });
    }

    cols.push(
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
    );

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
                <DocumentActionsMenuCell
                    entry={row.original}
                    createOptionsElement={createOptionsElement}
                />
            ),
        });
    }

    return cols;
}
