import * as React from "react"

import {cn} from "@/lib/utils.ts"
import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { MoreHorizontalIcon } from "lucide-react";
import type { CardEntry } from "@/components/Card.tsx";

function CardContainer({
                           className,
                           size = "default",
                           ...props
                       }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
    return (
        <div
            data-slot="card"
            data-size={size}
            className={cn(
                "group/card flex flex-col gap-4 overflow-clip rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
                className
            )}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-1 has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
                className
            )}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn(
                "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
                className
            )}
            {...props}
        />
    )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
                className
            )}
            {...props}
        />
    )
}

// function CardContent({ className, ...props }: React.ComponentProps<"div">) {
//     return (
//         <div
//             data-slot="card-content"
//             className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
//             {...props}
//         />
//     )
// }

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
                className
            )}
            {...props}
        />
    )
}

type CardProps = {
    entry: CardEntry;
    badges: string[];
    action: string;
    optionsWrapper?: (trigger: React.ReactNode) => React.ReactNode;
}
export default function EmployeeCard({
                                 entry, badges, action, optionsWrapper
                             }: CardProps) {

    return (
        <CardContainer className="relative mx-auto w-fit min-w-[250px] pb-6">

            {/* options button */}
            {optionsWrapper != null && (
                <div className="absolute top-3 right-3 z-10">
                    {optionsWrapper(
                        <Button variant="outline" size="icon">
                            <MoreHorizontalIcon />
                        </Button>
                    )}
                </div>
            )}

            {/* avatar */}
            <div className="flex justify-center">
                <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
            </div>

            {/* content */}
            <CardHeader className="text-center">
                <CardTitle>{entry.title}</CardTitle>
                <div className="flex justify-center mt-2">
                    <Badge variant="secondary">
                        {entry.badge}
                    </Badge>
                </div>
                <CardDescription>{entry.description}</CardDescription>
            </CardHeader>

        </CardContainer>
    )
}

function viewItem(link: string) {
    window.open(link, "_blank")
}
