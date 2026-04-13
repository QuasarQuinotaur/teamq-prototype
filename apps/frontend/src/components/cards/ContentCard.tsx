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
import { stringToAccentBgClass } from "@/lib/card-accent.ts"

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
    // Favicon-based image
    const linkDomain = entry.link
        .replace('https://', '')
        .replace('http://', '')
        .split('/')[0];

    const linkFavicon = `https://www.google.com/s2/favicons?sz=128&domain=${linkDomain}`;

    const cardColor = stringToAccentBgClass(entry.title)

    const [cardHovered, setCardHovered] = React.useState(false);
    /** After collapse animation, restore single-line ellipsis; cleared on hover. */
    const [titleCollapsedClamp, setTitleCollapsedClamp] = React.useState(true);
    const titleCollapseTimerRef = React.useRef<number | null>(null);

    const TITLE_COLLAPSE_MS = 500;

    function handleCardPointerEnter() {
        if (titleCollapseTimerRef.current != null) {
            window.clearTimeout(titleCollapseTimerRef.current);
            titleCollapseTimerRef.current = null;
        }
        setTitleCollapsedClamp(false);
        setCardHovered(true);
    }

    function handleCardPointerLeave() {
        setCardHovered(false);
        titleCollapseTimerRef.current = window.setTimeout(() => {
            setTitleCollapsedClamp(true);
            titleCollapseTimerRef.current = null;
        }, TITLE_COLLAPSE_MS);
    }

    React.useEffect(() => {
        return () => {
            if (titleCollapseTimerRef.current != null) {
                window.clearTimeout(titleCollapseTimerRef.current);
            }
        };
    }, []);

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

    // Get the discord-style link preview from the backend
    const [preview, setPreview] = React.useState<{
        title?: string;
        description?: string;
        image?: string | null;
    } | null>(null);

    React.useEffect(() => {
        // wrap function bc useEffect can't be async
        const fetchPreview = async () => {
            try {
                // only run for external links, not PDFs or other stored files
                if (isSupabasePath(entry.link)) return;

                // call backend route
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/link-preview?url=${encodeURIComponent(entry.link)}`
                );

                if (!res.ok) return;

                // convert response in JS object
                const data = await res.json();

                // store data, triger re-render
                setPreview(data);

            } catch (err) {
                // log errors but don't break UI
                console.error("Preview fetch failed", err);
            }
        };

        fetchPreview();
    }, [entry]); //" run this code whenever entry changes (for new cards)"


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
            onPointerEnter={handleCardPointerEnter}
            onPointerLeave={handleCardPointerLeave}
        >
            <CardHeader className="pb-3 shrink-0">
                <div className="flex w-full items-start justify-between gap-2">
                    <div
                        className={cn(
                            "overflow-hidden flex-1 min-w-0 transition-[max-height] ease-in-out",
                            cardHovered
                                ? "max-h-24 duration-300"
                                : "max-h-[1.4em] duration-500",
                        )}
                    >
                        <CardTitle
                            className={cn(
                                "min-w-0 break-words",
                                titleCollapsedClamp && "line-clamp-1",
                            )}
                        >
                            {entry.title}
                        </CardTitle>
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
                    // PDFs
                    <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${thumbnail}`}
                        className="w-full h-full object-cover"
                    />
                ) : preview?.image ? (
                    // LINKS - discord style preview
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src={preview.image}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                ) : entry.link.startsWith("http") ? (
                    // FALLBACK 1 -> FAVICON ICON
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src={linkFavicon}
                            className="max-w-[60%] max-h-[60%] object-contain"
                        />
                    </div>
                ) : (
                    // FALLBACK 2 -> COLOR CARD
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