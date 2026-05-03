import type { ColumnDef } from "@tanstack/react-table"
import type { CardEntry } from "@/components/cards/Card.tsx"
import * as React from "react"
import { BookOpen, FileText, GitBranch, Globe, Star, Wrench } from "lucide-react"
import { cn } from "@/lib/utils.ts"
import { isSupabasePath } from "@/lib/utils.ts"
import { Avatar, AvatarFallback, AvatarImage } from "@/elements/avatar.tsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/elements/tooltip.tsx"

const CONTENT_TYPE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    tool: Wrench,
    reference: BookOpen,
    workflow: GitBranch,
};

function ContentTypeIcon({ badge, link }: { badge?: string; link?: string }) {
    const TypeIcon = badge ? CONTENT_TYPE_ICON_MAP[badge] : undefined;
    if (TypeIcon) {
        return <TypeIcon className="size-4 text-muted-foreground shrink-0" />;
    }
    // Uploaded file vs web link fallback
    if (link && isSupabasePath(link)) {
        return <FileText className="size-4 text-muted-foreground shrink-0" />;
    }
    return <Globe className="size-4 text-muted-foreground shrink-0" />;
}

function TitleCell({
    entry,
    renderTitleCell,
}: {
    entry: CardEntry;
    renderTitleCell?: (entry: CardEntry) => React.ReactNode;
}) {
    const titleContent = renderTitleCell ? renderTitleCell(entry) : entry.title;
    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 truncate">{titleContent}</div>
        </div>
    );
}

function TagsCell({ entry }: { entry: CardEntry }) {
    const tags = entry.tags ?? [];
    if (tags.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-0.5 whitespace-normal">
            {tags.map((tag) => (
                <span
                    key={tag.id}
                    className="inline-flex items-center rounded px-1.5 text-[10px] font-medium leading-4 shrink-0"
                    style={{
                        backgroundColor: `color-mix(in oklab, ${tag.color} 15%, transparent)`,
                        color: `color-mix(in srgb, ${tag.color}, black 30%)`,
                        border: `1px solid color-mix(in srgb, ${tag.color}, black 20%)`,
                    }}
                >
                    {tag.tagName}
                </span>
            ))}
        </div>
    );
}

function ownerInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function OwnerCell({ owner, ownerImage }: { owner?: string; ownerImage?: string }) {
    if (!owner) return <span className="text-muted-foreground">—</span>;
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Avatar size="sm" className="cursor-default">
                        {ownerImage && <AvatarImage src={ownerImage} alt={owner} />}
                        <AvatarFallback>{ownerInitials(owner)}</AvatarFallback>
                    </Avatar>
                </TooltipTrigger>
                <TooltipContent side="top">{owner}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function FavoriteCell({
    entry,
    isFavorited,
    onToggleFavorite,
}: {
    entry: CardEntry;
    isFavorited: (entry: CardEntry) => boolean;
    onToggleFavorite: (entry: CardEntry) => void;
}) {
    const favorited = isFavorited(entry);
    return (
        <button
            type="button"
            className="rounded p-1 hover:bg-muted transition-colors"
            onClick={() => onToggleFavorite(entry)}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
            <Star
                className={cn(
                    "size-4 transition-colors",
                    favorited ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                )}
            />
        </button>
    );
}

function DocumentActionsMenuCell({
    entry,
    createOptionsElement,
}: {
    entry: CardEntry
    createOptionsElement: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode
}) {
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    return (
        <div
            data-row-click-ignore
            className="flex justify-end"
            onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                triggerRef.current?.click()
            }}
        >
            {createOptionsElement(
                entry,
                <button
                    ref={triggerRef}
                    type="button"
                    data-document-menu-trigger={entry.item.id}
                    className="rounded border px-2 py-1 text-sm hover:bg-muted"
                >
                    •••
                </button>,
            )}
        </div>
    )
}

export type CreateColumnsOptions = {
    headerName?: string;
    headerType?: string;
    renderTitleCell?: (entry: CardEntry) => React.ReactNode;
    /** When true, shows an image in the title cell. */
    showImage?: boolean;
    /** When true, shows an email column. */
    showEmail?: boolean;
    /** When true, hides the expiration column (documents-only). */
    omitExpiration?: boolean;
    /** When true, hides the type icon column. */
    omitTypeIcon?: boolean;
    /** When true, hides the owner column. */
    omitOwner?: boolean;
    /** When true, hides the tags column. */
    omitTags?: boolean;
    selectMode?: boolean;
    isEntrySelected?: (entry: CardEntry) => boolean;
    onToggleEntrySelect?: (entry: CardEntry) => void;
    /** Favorite state — when provided, a clickable star column is shown. */
    isFavorited?: (entry: CardEntry) => boolean;
    onToggleFavorite?: (entry: CardEntry) => void;
};

export function createColumns(
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode,
    options?: CreateColumnsOptions,
): ColumnDef<CardEntry>[] {
    const cols: ColumnDef<CardEntry>[] = [];

    if (options?.selectMode && options.isEntrySelected && options.onToggleEntrySelect) {
        cols.push({
            id: "select",
            header: "",
            size: 36,
            cell: ({ row }) => {
                const entry = row.original;
                const checked = options.isEntrySelected!(entry);
                return (
                    <div data-row-click-ignore className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="size-4 rounded border-input accent-primary"
                            checked={checked}
                            onChange={() => options.onToggleEntrySelect!(entry)}
                            aria-label={checked ? "Deselect row" : "Select row"}
                        />
                    </div>
                );
            },
        });
    }

    // File type icon column
    if (!options?.omitTypeIcon) {
        cols.push({
            id: "type-icon",
            header: "",
            size: 36,
            cell: ({ row }) => {
                const entry = row.original;
                return (
                    <div className="flex items-center justify-center">
                        <ContentTypeIcon badge={entry.badge} link={entry.link} />
                    </div>
                );
            },
        });
    }

    // Image column (e.g. employee profile picture)
    if (options?.showImage) {
        cols.push({
            id: "image",
            header: "",
            size: 48,
            cell: ({ row }) => {
                const entry = row.original;
                return (
                    <div className="flex items-center justify-center">
                        <Avatar size="sm" className="shrink-0">
                            {entry.image && <AvatarImage src={entry.image} alt={entry.title} />}
                            <AvatarFallback>{ownerInitials(entry.title)}</AvatarFallback>
                        </Avatar>
                    </div>
                );
            },
        });
    }

    cols.push(
        {
            accessorKey: "title",
            header: options?.headerName ?? "Title",
            cell: ({ row }) => (
                <TitleCell
                    entry={row.original}
                    renderTitleCell={options?.renderTitleCell}
                />
            ),
        },
    );

    if (options?.showEmail) {
        cols.push({
            accessorKey: "link",
            header: "Email",
            cell: ({ row }) => (
                <div className="text-muted-foreground truncate">
                    {row.original.link}
                </div>
            ),
        });
    }

    if (!options?.omitOwner) {
        cols.push({
            accessorKey: "owner",
            header: "Owner",
            size: 60,
            cell: ({ row }) => <OwnerCell owner={row.original.owner} ownerImage={row.original.ownerImage} />,
        });
    }

    if (!options?.omitExpiration) {
        cols.push({
            accessorKey: "expirationDate",
            header: "Expiration",
            cell: ({ getValue }) => {
                const value = getValue();

                if (!value) return "—";

                const date = new Date(value as string);

                return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                });
            },
        });
    }

    cols.push({
        accessorKey: "badge",
        header: options?.headerType ?? "Type",
        cell: ({ row }) => {
            const badge = row.original.badge;
            if (!badge) return null;
            return badge.charAt(0).toUpperCase() + badge.slice(1);
        },
    });

    // Tags column
    if (!options?.omitTags) {
        cols.push({
            id: "tags",
            header: "Tags",
            cell: ({ row }) => <TagsCell entry={row.original} />,
        });
    }

    // Favorite icon column
    if (options?.isFavorited && options?.onToggleFavorite) {
        cols.push({
            id: "favorite",
            header: "",
            size: 44,
            cell: ({ row }) => (
                <div data-row-click-ignore className="flex items-center justify-center">
                    <FavoriteCell
                        entry={row.original}
                        isFavorited={options.isFavorited!}
                        onToggleFavorite={options.onToggleFavorite!}
                    />
                </div>
            ),
        });
    }

    if (createOptionsElement) {
        cols.push({
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <DocumentActionsMenuCell
                    entry={row.original}
                    createOptionsElement={createOptionsElement}
                />
            ),
        });
    }

    return cols;
}
