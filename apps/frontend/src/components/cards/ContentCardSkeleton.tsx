import * as React from "react";
import { CardContainer, CardHeader } from "@/components/cards/Card.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";

/** Placeholder grid cell matching {@link ContentCard} layout while documents load. */
export default function ContentCardSkeleton() {
    return (
        <CardContainer className="relative w-full h-52 flex flex-col gap-0 pb-0 pointer-events-none select-none">
            <CardHeader className="pb-3 shrink-0">
                <Skeleton className="h-5 w-4/5 max-w-[min(100%,14rem)]" />
            </CardHeader>
            <div className="flex-1 min-h-0 relative z-20 overflow-hidden rounded-b-xl">
                <Skeleton className="absolute inset-0 size-full rounded-b-xl" />
                <div className="absolute z-30 flex bottom-2 right-2 gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                </div>
            </div>
        </CardContainer>
    );
}
