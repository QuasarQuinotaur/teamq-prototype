import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import * as React from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/Table.tsx"
import { EmptyResultsState } from "@/components/EmptyResultsState.tsx"
import { cn } from "@/lib/utils.ts"

import type { CardEntry } from "@/components/cards/Card.tsx"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    /** When set, list view rows open the item (e.g. document viewer) on click. */
    onRowClick?: (row: TData) => void
    /** Highlights rows when true and `isRowSelected` returns true (e.g. multi-select). */
    selectMode?: boolean
    isRowSelected?: (row: TData) => boolean
    /** Right-click row (outside interactive targets) — e.g. open document ⋯ menu. */
    onDocumentRowContextMenu?: (row: TData, e: React.MouseEvent) => void
    /** Tutorial: row for this entry gets `data-tutorial-doc-card`. */
    tutorialHighlightEntryId?: number | null
}

function isInteractiveTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false
    return Boolean(
        target.closest(
            "button, a, input, select, textarea, [role='button'], [role='menuitem'], [data-row-click-ignore]",
        ),
    )
}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             onRowClick,
                                             selectMode,
                                             isRowSelected,
                                             onDocumentRowContextMenu,
                                             tutorialHighlightEntryId,
                                         }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (data.length === 0) {
        return (
            <EmptyResultsState
                title="No results"
                description="Try adjusting your search or filter."
            />
        )
    }

    return (
        <div className="overflow-hidden rounded-md border">
            <Table className="bg-background">
                <TableHeader className={"bg-background"}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row, index) => {
                        const entry = row.original as CardEntry;
                        const isTutorialRow =
                            tutorialHighlightEntryId != null &&
                            entry.item.id === tutorialHighlightEntryId;
                        return (
                            <TableRow
                                key={row.id}
                                {...(isTutorialRow ? { "data-tutorial-doc-card": "" as const } : {})}
                                data-state={row.getIsSelected() && "selected"}
                                {...(selectMode
                                    ? (() => {
                                          const id = (row.original as { item?: { id?: unknown } })
                                              ?.item?.id;
                                          return typeof id === "number"
                                              ? { "data-marquee-entry-id": String(id) }
                                              : {};
                                      })()
                                    : {})}
                                className={cn(
                                    onRowClick && "cursor-pointer",
                                    selectMode && isRowSelected?.(row.original)
                                        ? "bg-primary/25"
                                        : index % 2 === 0 ? "bg-background" : "bg-muted/30",
                                    selectMode && "select-none",
                                )}
                                onDragStartCapture={
                                    selectMode
                                        ? (e) => e.preventDefault()
                                        : undefined
                                }
                                onContextMenu={
                                    onDocumentRowContextMenu
                                        ? (e) => {
                                              if (isInteractiveTarget(e.target)) return;
                                              onDocumentRowContextMenu(row.original, e);
                                          }
                                        : undefined
                                }
                                onClick={
                                    onRowClick
                                        ? (e) => {
                                              if (isInteractiveTarget(e.target)) return
                                              onRowClick(row.original)
                                          }
                                        : undefined
                                }
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    )
}