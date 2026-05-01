import * as React from "react";
import { CardContainer, CardHeader } from "@/components/cards/Card.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";

/** Placeholder grid cell matching {@link EmployeeCard} layout while employees load. */
export default function EmployeeCardSkeleton() {
    const avatarFrame = "h-32 w-32 shrink-0 rounded-full border-4 border-background shadow-md";

    return (
        <CardContainer className="relative mx-auto w-fit min-w-[250px] pb-6 pointer-events-none select-none">
            <div className="absolute top-3 right-3 z-10">
                <Skeleton className="size-9 rounded-md" />
            </div>

            <div className="flex justify-center">
                <Skeleton className={avatarFrame} />
            </div>

            <CardHeader className="text-center">
                <Skeleton className="mx-auto h-5 w-44 max-w-[90%]" />
                <div className="mt-2 flex justify-center">
                    <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <Skeleton className="mx-auto mt-2 h-4 w-48 max-w-[85%]" />
            </CardHeader>
        </CardContainer>
    );
}
