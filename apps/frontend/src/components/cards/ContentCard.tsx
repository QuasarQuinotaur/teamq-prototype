// Displays information about content (workflow, reference, tool)

import * as React from "react"
import {cn, isSupabasePath} from "@/lib/utils.ts"
import {Button} from "@/elements/buttons/button.tsx";
import { BookOpen, Check, GitBranch, MoreHorizontalIcon, Wrench } from "lucide-react";
import {
    type CardEntry,
    type CardState,
    CardAction,
    CardContainer,
    CardHeader,
    CardTitle
} from "@/components/cards/Card.tsx";
import type {Content} from "db";
import {CONTENT_TYPE_MAP} from "@/components/input/constants.tsx";
import BadgeList, {type BadgeInfo} from "@/elements/badge-list.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/elements/tooltip.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/elements/avatar.tsx";
import ContentCardThumbnail, {
    googleFaviconUrlForLink,
    isPlainWebPageLink,
    useMicrolinkLinkPreview,
} from "@/components/cards/ContentCardThumbnail.tsx";
import { useThumbnailBatch } from "@/components/cards/ThumbnailBatchContext.tsx";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import useJobNameMap from "@/hooks/useJobNameMap";

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

const BADGE_NAMED_COLORS: Record<string, string> = { red: "ff0000", blue: "0000ff" };

const CONTENT_TYPE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    tool: Wrench,
    reference: BookOpen,
    workflow: GitBranch,
};

/** Height of each folder tab in px — also drives the 45° angle length. */
const TAB_H = 10;
/** Flat visible width of each tab (not counting the diagonal). */
const TAB_FLAT = 45;

function FolderTabs({ badges }: { badges: (string | BadgeInfo | null)[] }) {
    const valid = badges.filter((b): b is string | BadgeInfo => b != null && b !== "");
    if (!valid.length) return null;
    const tabFlat = valid.length === 1 ? TAB_FLAT * 1.2 : TAB_FLAT;
    // Trapezoid: flat left, flat top, 45° diagonal on right, flat bottom
    const clip = `polygon(0px 0px, ${tabFlat}px 0px, ${tabFlat + TAB_H}px ${TAB_H}px, 0px ${TAB_H}px)`;
    return (
        <div className="absolute top-0 left-1" style={{ height: TAB_H }}>
            {valid.map((badge, i) => {
                const color = typeof badge === "object" && "color" in badge ? badge.color : undefined;
                const hex = color ? (BADGE_NAMED_COLORS[color] ?? color.replace("#", "")) : null;
                const label = typeof badge === "string" ? badge : String(badge.node ?? "");
                return (
                    <TooltipProvider key={i} delayDuration={1000}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="absolute top-0 cursor-default"
                                    style={{
                                        left: i * tabFlat,
                                        zIndex: valid.length - i,
                                        width: tabFlat + TAB_H,
                                        height: TAB_H,
                                        background: i > 0
                                            ? `linear-gradient(to top right, rgba(0,0,0,0.22) 0%, transparent 65%), ${hex ? `#${hex}` : `var(--primary)`}`
                                            : hex ? `#${hex}` : `var(--primary)`,
                                        clipPath: clip,
                                        borderTopLeftRadius: i === 0 ? 4 : 0,
                                    }}
                                />
                            </TooltipTrigger>
                            {label && (
                                <TooltipContent side="top">
                                    {label}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
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
                                        onOpen
}: ContentCardProps) {
    const { loadAllowed } = useThumbnailBatch();
    const { tagsEnabled } = useMainContext();
    const plainWebLink = isPlainWebPageLink(entry);
    const linkMicrolink = useMicrolinkLinkPreview(
        entry.link,
        loadAllowed && plainWebLink,
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

    const titleRef = React.useRef<HTMLDivElement>(null);
    const [isTitleTruncated, setIsTitleTruncated] = React.useState(false);

    React.useEffect(() => {
        const el = titleRef.current;
        if (!el) return;
        const check = () => setIsTitleTruncated(el.scrollHeight > el.clientHeight);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    function handleCardClick() {
        if (selectMode && onSelectToggle) {
            onSelectToggle();
            return;
        }
        if (onOpen) {
            onOpen(entry);
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
    const jobNameMap = useJobNameMap()
    const jobPositionLabels = showJobPositionBadge
        ? content.jobPositions.map(
              (pos) =>
                  jobNameMap[
                      pos as keyof typeof jobNameMap
                  ] ?? pos,
          )
        : [];
    const isExpired =
        content.expirationDate &&
        new Date(content.expirationDate) < new Date();
    const expBadge: BadgeInfo | null = isExpired ? {node: "Expired", color: "red"} : null;

    const tagBadges: BadgeInfo[] = entry.tags ? entry.tags.map(tag => {
        return {node: tag.tagName, color: tag.color}
    }) : [];
    const allBadges = [expBadge, ...tagBadges, ...badges];

    const showBadges = tagsEnabled;

    return (
        <div className="relative" style={{ paddingTop: TAB_H }}>
        {!showBadges && <FolderTabs badges={allBadges} />}
        <CardContainer
            className="group relative w-full h-52 flex flex-col gap-0 cursor-pointer shadow-sm rounded-t-md"
            style={{ paddingBottom: 0 }}
            onClick={handleCardClick}
            onContextMenu={handleCardContextMenu}
        >
            <CardHeader className="pb-3 shrink-0 rounded-t-md">
                <div className="flex w-full items-start justify-between gap-2">

                    {/* TITLE + META BADGES */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex min-w-0 items-start gap-2">
                            {titleFaviconUrl ? (
                                <img
                                    src={titleFaviconUrl}
                                    alt=""
                                    className="mt-0.5 size-4 shrink-0 rounded-sm"
                                    draggable={false}
                                />
                            ) : null}

                            <TooltipProvider>
                                <Tooltip open={isTitleTruncated ? undefined : false}>
                                    <TooltipTrigger asChild>
                                        <CardTitle
                                            ref={titleRef}
                                            className="min-w-0 flex-1 break-words line-clamp-1"
                                        >
                                            {entry.title}
                                        </CardTitle>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        {entry.title}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* DOC TYPE + ROLE SUBTITLE */}
                        {(() => {
                            const TypeIcon = CONTENT_TYPE_ICON_MAP[content.contentType];
                            const typeLabel = showContentTypeBadge ? CONTENT_TYPE_MAP[content.contentType] : null;
                            const roleLabel = showJobPositionBadge && jobPositionLabels.length > 0 ? jobPositionLabels.join(", ") : null;
                            if (!typeLabel && !roleLabel) return null;
                            return (
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground/80">
                                    {typeLabel && TypeIcon && (
                                        <TypeIcon className="size-3 shrink-0" />
                                    )}
                                    {typeLabel && <span>{typeLabel}</span>}
                                    {typeLabel && roleLabel && <span className="opacity-50">·</span>}
                                    {roleLabel && <span className="truncate">{roleLabel}</span>}
                                </div>
                            );
                        })()}

                        {showBadges && allBadges.some((b) => b != null && b !== "") && (
                            <div className="mt-1">
                                <BadgeList badges={allBadges} />
                            </div>
                        )}
                    </div>

                    {/* OPTIONS */}
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

            <div className="flex-1 min-h-0 relative z-20 overflow-hidden rounded-b-xl">

                <div
                    className={cn(
                        "absolute inset-0 z-10 flex flex-col",
                        showCheckoutOverlay && "brightness-[0.45]",
                    )}
                >
                    <ContentCardThumbnail
                        entry={entry}
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
        </div>
    );
}