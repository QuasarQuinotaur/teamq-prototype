import * as React from "react"

import {cn} from "@/lib/utils.ts"
import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { MoreHorizontalIcon } from "lucide-react";
export type CardEntry = {
    item: object;
    title: string;
    link: string;
    description?: string;
    subElement?: React.ReactNode;
    badge?: string;
    image?: string;
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

type CardProps = {
    entry: CardEntry;
    badges: string[];
    action: string;
    optionsWrapper?: (trigger: React.ReactNode) => React.ReactNode;
}
const CARD_COLORS = [
    "bg-blue-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-indigo-500",
];

function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export default function Card({
    entry, badges, action, optionsWrapper
}: CardProps) {
    // Favicon-based image (commented out in case you want to restore it)
    // let linkDomain = entry.link.replace('https://', '').replace('http://', '');
    // const split = linkDomain.split('/');
    // if (split.length > 0) {
    //     linkDomain = split[0];
    // }
    // const imgDefault = "https://companieslogo.com/img/orig/THG-679dc08a.png?t=1720244494"
    // const linkFavicon = "https://favicon.vemetric.com/" + linkDomain + "?default=" + imgDefault

    const cardColor = stringToColor(entry.title);

    return (
        <CardContainer className="relative mx-auto w-full max-w-sm gap-0">
            <CardHeader>
                <div className={"flex w-full items-center"}>
                    <CardTitle className={"w-full"}>{entry.title}</CardTitle>
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
                <div className={`w-full aspect-video ${cardColor}`} />
                {/* Favicon-based image (commented out)
                <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
                <img
                    src={linkFavicon}
                    alt="Event cover"
                    className="z-20 w-full aspect-video object-cover brightness-60 grayscale dark:brightness-40"
                />
                */}
                <div className={"absolute z-40 flex bottom-2 right-2 gap-2"}>
                    {[entry.badge, ...badges].filter((b) => b != null && b !== "").map((badgeString) => (
                        <Badge variant="secondary">
                            {badgeString!.charAt(0).toUpperCase() + badgeString!.slice(1)}
                        </Badge>
                    ))}
                </div>
            </div>
            <CardFooter>
                <Button
                    onClick={() => viewItem(entry.link, entry.item)}
                    className="w-full"
                >
                    {action}
                </Button>
            </CardFooter>
        </CardContainer>
    )
}

function isSupabasePath(link: string) {
    return !link.startsWith("http://") && !link.startsWith("https://");
}

async function viewItem(link: string, item: object) {
    if (isSupabasePath(link)) {
        const id = (item as { id: number }).id;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/content/${id}/download`, {
            credentials: "include",
        });
        if (!res.ok) {
            console.error("Failed to get download URL");
            return;
        }
        const { url } = await res.json();
        window.open(url, "_blank");
    } else {
        window.open(link, "_blank");
    }
}
