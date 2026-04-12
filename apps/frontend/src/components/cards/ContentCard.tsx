// Displays information about content (workflow, reference, tool)

import * as React from "react"
import {cn} from "@/lib/utils.ts"
import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { MoreHorizontalIcon } from "lucide-react";
import {
    type CardEntry,
    type CardState,
    CardAction,
    CardContainer,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/cards/Card.tsx";

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

function isSupabasePath(link: string) {
    return !link.startsWith("http://") && !link.startsWith("https://");
}

async function viewItem(link: string, item: object & { id: number }) {
    if (isSupabasePath(link)) {
        const id = (item as { id: number }).id;
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/${id}/download`, {
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

type ContentCardProps = {
    action: string;
    onView?: (entry: CardEntry) => void;
} & CardState;
export default function ContentCard({
                                 action,
                                 entry,
                                 badges,
                                 createOptionsElement,
                                 onView,
}: ContentCardProps) {
    // Favicon-based image (commented out in case you want to restore it)
    // let linkDomain = entry.link.replace('https://', '').replace('http://', '');
    // const split = linkDomain.split('/');
    // if (split.length > 0) {
    //     linkDomain = split[0];
    // }
    // const imgDefault = "https://companieslogo.com/img/orig/THG-679dc08a.png?t=1720244494"
    // const linkFavicon = "https://favicon.vemetric.com/" + linkDomain + "?default=" + imgDefault

    const cardColor = stringToColor(entry.title);

    // Get the pdf preview from the backend
    const [thumbnail, setThumbnail] = React.useState<string | null>(null);
    React.useEffect(() => {
        const fetchThumbnail = async () => {
            try {
                // only for your stored files
                if (!isSupabasePath(entry.link)) return;

                const id = (entry.item as { id: number }).id;

                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/content/${id}/thumbnail`,
                    { credentials: "include" }
                );

                if (!res.ok) return;

                const data = await res.json();

                setThumbnail(data.thumbnailUrl);
            } catch (err) {
                console.error("Thumbnail fetch failed", err);
            }
        };

        fetchThumbnail();
    }, [entry]);

    return (
        <CardContainer className="relative w-full h-full flex flex-col justify-between gap-3">
            <CardHeader>
                <div className="flex w-full items-start justify-between gap-2">
                    <CardTitle className="line-clamp-3 break-normal flex-1">{entry.title}</CardTitle>
                    {createOptionsElement != null && (
                        <CardAction className="shrink-0">
                            {createOptionsElement(
                                // Create the "..." button and pass it to make a surrounding element
                                // This gives functionality to the button like showing a dropdown
                                <Button variant="outline" size="icon" className="h-7 w-7 p-0">
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                            )}
                        </CardAction>
                    )}
                </div>
                <CardDescription>
                    {entry.description ? (
                        <>
                            <p>{entry.description}</p>
                        </>
                    ) : null}
                    {entry.subElement ?? undefined}
                </CardDescription>
            </CardHeader>
            <div className={"mt-2 relative z-20"}>
                {/* Favicon-based image (commented out)
                <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
                <img
                    src={linkFavicon}
                    alt="Event cover"
                    className="z-20 w-full aspect-video object-cover brightness-60 grayscale dark:brightness-40"
                />
                */}
                {thumbnail ? (
                    <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${thumbnail}`}
                        className="w-full aspect-[4/3] object-cover"
                    />
                ) : (
                    <div className={`w-full aspect-[4/3] ${cardColor}`} />
                )}

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
                    onClick={() => {
                        if (onView && isSupabasePath(entry.link)) {
                            onView(entry);
                        } else {
                            viewItem(entry.link, entry.item);
                        }
                    }}
                    className="w-full"
                >
                    {action}
                </Button>
            </CardFooter>
        </CardContainer>
    )
}