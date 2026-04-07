import * as React from "react"

import {cn} from "@/lib/utils.ts"
import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { MoreHorizontalIcon } from "lucide-react";
import type {Item} from "@/components/forms/Form.tsx";
export type CardEntry<T extends Item> = {
    item: T;
    description?: string;
    subElement?: React.ReactNode;
    badge?: string;
}

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
                "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
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

type CardProps<T extends Item> = {
    entry: CardEntry<T>;
    badges: string[];
    action: string;
    optionsWrapper?: (trigger: React.ReactNode) => React.ReactNode;
}
export default function Card<T extends Item>({
    entry, badges, action, optionsWrapper
}: CardProps<T>) {
    let linkDomain = entry.item.link.replace('https://', '').replace('http://', '');
    const split = linkDomain.split('/');
    if (split.length > 0) {
        linkDomain = split[0];
    }

    const imgDefault = "https://companieslogo.com/img/orig/THG-679dc08a.png?t=1720244494"
    const linkFavicon = "https://favicon.vemetric.com/" + linkDomain + "?default=" + imgDefault

    return (
        <CardContainer className="relative mx-auto w-full max-w-sm gap-0">
            <CardHeader>
                <div className={"flex w-full items-center"}>
                    <CardTitle className={"w-full"}>{entry.item.title}</CardTitle>
                    <div className={"w-full"}/>
                    {optionsWrapper != null && (
                        // Show options button only if wrapped
                        <CardAction>
                            {optionsWrapper(
                                <Button variant={"outline"}>
                                    <MoreHorizontalIcon/>
                                </Button>
                            )}
                        </CardAction>
                    )}
                </div>
                <CardDescription>
                    {entry.description ? (
                        <>
                            <p>{entry.description}</p>
                            <br/>
                        </>
                    ) : null}
                    {entry.subElement ?? undefined}
                </CardDescription>
            </CardHeader>
            <div className={"mt-2 relative z-20"}>
                <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
                <img
                    src={linkFavicon}
                    alt="Event cover"
                    className="z-20 w-full aspect-video object-cover brightness-60 grayscale dark:brightness-40"
                />
                <div className={"absolute z-40 flex bottom-2 right-2 gap-2"}>
                    {[entry.badge, ...badges].map((badgeString) => (
                        badgeString != null ? (
                            <Badge variant="secondary">
                                {badgeString}
                            </Badge>
                        ) : (<></>)
                    ))}
                </div>
            </div>
            <CardFooter>
                <Button
                    onClick={() => viewItem(entry.item.link)}
                    className="w-full"
                >
                    {action}
                </Button>
            </CardFooter>
        </CardContainer>
    )
}

function viewItem(link: string) {
    window.open(link, "_blank")
}
