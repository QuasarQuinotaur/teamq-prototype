// Displays information about content (workflow, reference, tool)

import * as React from "react"
import {cn} from "@/lib/utils.ts"
import {Badge} from "@/elements/badge.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { Check, MoreHorizontalIcon } from "lucide-react";
import {
    type CardEntry,
    type CardState,
    CardAction,
    CardContainer,
    CardHeader,
    CardTitle
} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import {CONTENT_TYPE_MAP, JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";
import BadgeList from "@/elements/badge-list.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/elements/avatar.tsx";
import ContentCardThumbnail, {
    googleFaviconUrlForLink,
    isPlainWebPageLink,
    isSupabasePath,
    useInViewOnce,
    useMicrolinkLinkPreview,
} from "@/components/cards/ContentCardThumbnail.tsx";

type ContentWithCheckout = Content & {
    isCheckedOut?: boolean;
    checkedOutById?: number | null;
    checkedOutBy?: {
        firstName: string;
        lastName: string;
        profileImageUrl?: string;
    } | null;
};

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
    /** When set, checkout dimmer/avatar/dots are hidden if this user holds the checkout (others still see them). */
    viewerEmployeeId?: number | null;
} & CardState;

export default function ContentCard({
                                        entry,
                                        badges,
                                        createOptionsElement,
                                        onView,
                                        showContentTypeBadge = true,
                                        showJobPositionBadge = true,
                                        viewerEmployeeId,
                                        selectMode,
                                        selected,
                                        onSelectToggle,
}: ContentCardProps) {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const cardVisible = useInViewOnce(cardRef);
    const plainWebLink = isPlainWebPageLink(entry);
    const linkMicrolink = useMicrolinkLinkPreview(
        entry.link,
        cardVisible && plainWebLink,
    );
    const isExternalUrl = Boolean(entry.link && !isSupabasePath(entry.link));
    /** Microlink site logo when available; otherwise hostname favicon — for every URL-based link card. */
    const titleFaviconUrl = React.useMemo(() => {
        if (!isExternalUrl || !entry.link) return null;
        const fallback = googleFaviconUrlForLink(entry.link);
        if (!plainWebLink) return fallback;
        if (linkMicrolink.done && linkMicrolink.faviconUrl) return linkMicrolink.faviconUrl;
        return fallback;
    }, [
        isExternalUrl,
        entry.link,
        plainWebLink,
        linkMicrolink.done,
        linkMicrolink.faviconUrl,
    ]);

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

    function handleCardClick() {
        if (selectMode && onSelectToggle) {
            onSelectToggle();
            return;
        }
        if (onView && isSupabasePath(entry.link)) {
            onView(entry);
        } else {
            viewItem(entry.link, entry.item);
        }
    }

    const menuTriggerRef = React.useRef<HTMLButtonElement>(null);

    function handleCardContextMenu(e: React.MouseEvent) {
        if (!createOptionsElement) return;
        const t = e.target;
        if (
            t instanceof Element &&
            t.closest("a[href], input, textarea, select, [contenteditable='true']")
        ) {
            return;
        }
        e.preventDefault();
        menuTriggerRef.current?.click();
    }

    const content = entry.item as ContentWithCheckout;
    const checkedOut = content.isCheckedOut === true;
    const showCheckoutOverlay =
        checkedOut &&
        (viewerEmployeeId == null ||
            content.checkedOutById == null ||
            content.checkedOutById !== viewerEmployeeId);
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
            ref={cardRef}
            className="group relative w-full h-52 flex flex-col gap-0 cursor-pointer pb-0 shadow-sm"
            onClick={handleCardClick}
            onContextMenu={handleCardContextMenu}
            onPointerEnter={handleCardPointerEnter}
            onPointerLeave={handleCardPointerLeave}
        >
            <CardHeader className="pb-3 shrink-0">
                <div className="flex w-full items-start justify-between gap-2">
                    <div
                        className={cn(
                            "min-w-0 flex-1 overflow-hidden transition-[max-height] duration-500 ease-in-out",
                            cardHovered ? "max-h-24" : "max-h-[1.4em]",
                        )}
                    >
                        <div className="flex min-w-0 items-start gap-2">
                            {titleFaviconUrl ? (
                                <img
                                    src={titleFaviconUrl}
                                    alt=""
                                    className="mt-0.5 size-4 shrink-0 rounded-sm"
                                    draggable={false}
                                />
                            ) : null}
                            <CardTitle
                                className={cn(
                                    "min-w-0 flex-1 break-words",
                                    titleCollapsedClamp && "line-clamp-1",
                                )}
                            >
                                {entry.title}
                            </CardTitle>
                        </div>

                        {/* On hover: expiration — same motion as bottom badges */}
                        {expBadge && (
                            <div
                                className={cn(
                                    "flex gap-2 py-1 transition-transform duration-500 ease-in-out",
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
                                <Button
                                    ref={menuTriggerRef}
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 p-0"
                                    data-document-menu-trigger={entry.item.id}
                                >
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
                        showCheckoutOverlay && "brightness-[0.45]",
                    )}
                >
                    <ContentCardThumbnail
                        entry={entry}
                        visible={cardVisible}
                        linkMicrolink={plainWebLink ? linkMicrolink : undefined}
                        linkTitleFaviconUrl={plainWebLink ? titleFaviconUrl : undefined}
                    />
                </div>

                {showCheckoutOverlay ? (
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
                            "absolute z-40 bottom-2 right-2 flex max-w-[calc(100%-1rem)] flex-col items-end gap-1 origin-bottom transition-transform duration-500 ease-in-out",
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
            {selectMode && selected ? (
                <div
                    className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center rounded-xl bg-primary/45"
                    aria-hidden
                >
                    <Check
                        className="size-10 text-white drop-shadow-md"
                        strokeWidth={2.75}
                        aria-hidden
                    />
                </div>
            ) : null}
        </CardContainer>
    )
}