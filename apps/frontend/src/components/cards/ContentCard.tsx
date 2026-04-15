// Displays information about content (workflow, reference, tool)

import * as React from "react"
import {cn} from "@/lib/utils.ts"
import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {FileIcon, MoreHorizontalIcon} from "lucide-react";
import {
    type CardEntry,
    type CardState,
    CardAction,
    CardContainer,
    CardHeader,
    CardTitle
} from "@/components/cards/Card.tsx";
import { stringToAccentBgClass } from "@/lib/card-accent.ts"
import type {Content} from "db";
import {CONTENT_TYPE_MAP, JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";
import BadgeList from "@/elements/badge-list.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/elements/avatar.tsx";

type ContentWithCheckout = Content & {
    isCheckedOut?: boolean;
    checkedOutById?: number | null;
    checkedOutBy?: {
        firstName: string;
        lastName: string;
        profileImageUrl?: string;
    } | null;
};

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
    /** When false, hides the entry's job-position badge (still shows extra `badges` from CardState). */
    showJobPositionBadge?: boolean;
} & CardState;

export default function ContentCard({
                                        entry,
                                        badges,
                                        createOptionsElement,
                                        onView,
                                        showContentTypeBadge = true,
                                        showJobPositionBadge = true,
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

    /** Matches header `transition-[max-height]` / badge motion so line-clamp restores after collapse finishes. */
    const CARD_HOVER_TRANSITION_MS = 500;

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
        }, CARD_HOVER_TRANSITION_MS);
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

    const content = entry.item as ContentWithCheckout;
    const checkedOut = content.isCheckedOut === true;
    const who = content.checkedOutBy;
    const checkoutInitials = who
        ? `${who.firstName?.[0] ?? ""}${who.lastName?.[0] ?? ""}`.trim() || "?"
        : "?";
    const jobPositionLabels = showJobPositionBadge
        ? content.jobPositions.map(
              (pos) =>
                  JOB_POSITION_TYPE_MAP[
                      pos as keyof typeof JOB_POSITION_TYPE_MAP
                  ] ?? pos,
          )
        : [];
    const isExpired =
        content.expirationDate &&
        new Date(content.expirationDate) < new Date();
    const roleBadges = [
        ...jobPositionLabels,
        ...(showContentTypeBadge ? [CONTENT_TYPE_MAP[content.contentType]] : []),
        ...badges,
    ]
    const expBadge = isExpired ? "Expired" : null;

    return (
        <CardContainer
            className="group relative w-full h-52 flex flex-col gap-0 cursor-pointer pb-0 shadow-sm"
            onClick={handleCardClick}
            onPointerEnter={handleCardPointerEnter}
            onPointerLeave={handleCardPointerLeave}
        >
            <CardHeader className="pb-3 shrink-0">
                <div className="flex w-full items-start justify-between gap-2">
                    <div
                        className={cn(
                            "min-w-0 flex-1 overflow-hidden transition-[max-height] duration-500 ease-in-out motion-reduce:transition-none",
                            cardHovered ? "max-h-24" : "max-h-[1.4em]",
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

                        {/* On hover: expiration — same motion as bottom badges */}
                        {expBadge && (
                            <div
                                className={cn(
                                    "flex gap-2 py-1 transition-transform duration-500 ease-in-out motion-reduce:translate-y-0 motion-reduce:transition-none",
                                    cardHovered
                                        ? "translate-y-0"
                                        : "translate-y-[calc(200%+1.25rem)]",
                                )}
                            >
                                <Badge className="bg-red-500/20 text-red-600 border-red-400/30">
                                    {expBadge}
                                </Badge>
                            </div>
                        )}

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

                <div
                    className={cn(
                        "absolute inset-0 z-10 flex flex-col",
                        checkedOut && "brightness-[0.45]",
                    )}
                >
                    {thumbnail ? (
                        // PDFs
                        <img
                            src={`${import.meta.env.VITE_BACKEND_URL}${thumbnail}`}
                            className="w-full h-full object-cover"
                            alt=""
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
                        // FALLBACK 1 ->  FAVICON
                        <div className="w-full h-full flex items-center justify-center bg-muted/30">
                            <img
                                src={linkFavicon}
                                className="max-w-[60%] max-h-[60%] object-contain"
                                alt=""
                            />
                        </div>
                    ) : (
                        // FALLBACK 2 -> COLOR CARD
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <FileIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {checkedOut ? (
                    <>
                        <div className="pointer-events-none absolute inset-0 z-30 bg-black/35" aria-hidden />
                        <div className="pointer-events-none absolute left-2 top-2 z-40">
                            <Avatar size="sm" className="size-9 ring-2 ring-background shadow-sm">
                                {who?.profileImageUrl ? (
                                    <AvatarImage src={who.profileImageUrl} alt="" />
                                ) : null}
                                <AvatarFallback className="text-xs font-medium">
                                    {checkoutInitials}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div
                            className="pointer-events-none absolute inset-0 z-[35] flex items-center justify-center"
                            aria-label="Checked out"
                        >
                            <span className="flex items-end gap-0.5">
                                <span className="checkout-dots-dot inline-block h-1 w-1 rounded-full bg-white" />
                                <span className="checkout-dots-dot inline-block h-1 w-1 rounded-full bg-white" />
                                <span className="checkout-dots-dot inline-block h-1 w-1 rounded-full bg-white" />
                            </span>
                        </div>
                    </>
                ) : null}

                {roleBadges.some((b) => b != null && String(b).trim() !== "") ? (
                    <div
                        className={cn(
                            "absolute z-40 bottom-2 right-2 flex max-w-[calc(100%-1rem)] flex-col items-end gap-1 origin-bottom transition-transform duration-500 ease-in-out motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-none",
                            cardHovered
                                ? "translate-y-0 scale-100"
                                : "pointer-events-none translate-y-[calc(200%+1.25rem)] scale-[0.97]",
                        )}
                    >
                        <div className="flex flex-wrap justify-end gap-2">
                            <BadgeList badges={roleBadges} />
                        </div>
                    </div>
                ) : null}
            </div>
        </CardContainer>
    )
}