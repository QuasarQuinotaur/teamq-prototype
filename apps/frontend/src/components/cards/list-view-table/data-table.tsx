import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/Table.tsx"
import { cn } from "@/lib/utils.ts"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    /** When set, clicking a row (outside buttons/links) invokes this handler. */
    onRowClick?: (row: TData) => void
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
                                         }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
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
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={cn(onRowClick && "cursor-pointer")}
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
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}