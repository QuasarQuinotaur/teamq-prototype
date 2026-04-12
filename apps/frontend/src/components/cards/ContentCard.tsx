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
    onView?: (entry: CardEntry) => void;
    /** When false, hides the entry's content-type badge (still shows extra `badges` from CardState). */
    showContentTypeBadge?: boolean;
} & CardState;
export default function ContentCard({
                                 entry,
                                 badges,
                                 createOptionsElement,
                                 onView,
                                 showContentTypeBadge = true,
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

    function handleCardClick() {
        if (onView && isSupabasePath(entry.link)) {
            onView(entry);
        } else {
            viewItem(entry.link, entry.item);
        }
    }

    return (
        <CardContainer
            className="relative w-full h-52 flex flex-col gap-0 cursor-pointer pb-0"
            onClick={handleCardClick}
        >
            <CardHeader className="pb-3 shrink-0">
                <div className="flex w-full items-start justify-between gap-2">
                    <div className="overflow-hidden max-h-[1.4em] transition-[max-height] duration-300 ease-in-out group-hover/card:max-h-24 flex-1 min-w-0">
                        <CardTitle className="break-words">{entry.title}</CardTitle>
                    </div>
                    {createOptionsElement != null && (
                        <CardAction className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            {createOptionsElement(
                                <Button variant="outline" size="icon" className="h-7 w-7 p-0">
                                    <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                            )}
                        </CardAction>
                    )}
                </div>
            </CardHeader>
            <div className={"flex-1 min-h-0 relative z-20 overflow-hidden rounded-b-xl"}>
                {thumbnail ? (
                    <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${thumbnail}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className={`w-full h-full ${cardColor}`} />
                )}

                <div className={"absolute z-40 flex bottom-2 right-2 gap-2"}>
                    {[
                        ...(showContentTypeBadge ? [entry.badge] : []),
                        ...badges,
                    ].filter((b) => b != null && b !== "").map((badgeString) => (
                        <Badge variant="secondary">
                            {badgeString!.charAt(0).toUpperCase() + badgeString!.slice(1)}
                        </Badge>
                    ))}
                </div>
            </div>
        </CardContainer>
    )
}