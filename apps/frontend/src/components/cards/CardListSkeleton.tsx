import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/Table.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";

const COLUMNS = [
    { label: "Title",      cellClass: "w-[40%]",  skeletonClass: "h-4 w-3/4"     },
    { label: "Owner",      cellClass: "w-[20%]",  skeletonClass: "h-4 w-2/3"     },
    { label: "Expiration", cellClass: "w-[15%]",  skeletonClass: "h-4 w-20"      },
    { label: "Type",       cellClass: "w-[15%]",  skeletonClass: "h-4 w-16"      },
    { label: "",           cellClass: "w-[10%]",  skeletonClass: "h-6 w-10 ml-auto rounded" },
] as const;

type CardListSkeletonProps = {
    /** Number of placeholder rows to render. Defaults to 8. */
    rows?: number;
};

/** Placeholder table matching {@link CardList} / {@link DataTable} layout while entries load. */
export default function CardListSkeleton({ rows = 8 }: CardListSkeletonProps) {
    return (
        <div className="container mx-auto py-4 px-4" aria-busy="true" aria-label="Loading entries">
            <div className="overflow-hidden rounded-md border">
                <Table className="bg-muted/50">
                    <TableHeader className="bg-background">
                        <TableRow>
                            {COLUMNS.map((col) => (
                                <TableHead key={col.label} className={col.cellClass}>
                                    {col.label ? (
                                        <Skeleton className="h-3.5 w-16" />
                                    ) : null}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: rows }, (_, i) => (
                            <TableRow key={i} className="pointer-events-none select-none">
                                {COLUMNS.map((col) => (
                                    <TableCell key={col.label} className={col.cellClass}>
                                        <Skeleton className={col.skeletonClass} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
