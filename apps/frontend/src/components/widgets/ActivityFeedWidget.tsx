import { useEffect, useMemo, useRef, useState } from "react";
import { isSameDay } from "date-fns";
import { Eye, PencilLine, Plus, Trash2, Loader2 } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/cards/Card.tsx";
import { EmptyResultsState } from "@/components/EmptyResultsState.tsx";
import { cn } from "@/lib/utils.ts";

type ActivityApiEvent = {
    type: string;
    contentId: number;
    contentTitle: string;
    employeeId: number | null;
    employeeName: string | null;
    timestamp: string;
};

function formatEventLine(event: ActivityApiEvent): { action: string; doc: string } {
    const title =
        event.contentTitle.trim() ||
        `Document #${event.contentId}`;
    const whom = event.employeeName ?? "Someone";
    switch (event.type) {
        case "created":
            return { action: `${whom} added`, doc: title };
        case "updated":
            return { action: `${whom} updated`, doc: title };
        case "accessed":
            return { action: `${whom} viewed`, doc: title };
        case "deleted":
            return { action: `${whom} deleted`, doc: title };
        default:
            return { action: `${whom} · ${event.type}`, doc: title };
    }
}

function formatWhen(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const absMin = Math.abs(Math.round(diffMs / 60000));
    if (absMin < 1) return "just now";
    if (absMin < 60) return `${absMin}m ago`;
    const absHr = Math.round(absMin / 60);
    if (absHr < 24 && isSameDay(d, now)) return `${absHr}h ago`;
    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

const TYPE_ICON: Record<
    string,
    typeof Plus
> = {
    created: Plus,
    updated: PencilLine,
    accessed: Eye,
    deleted: Trash2,
};

const TYPE_ICON_BG: Record<string, string> = {
    created: "bg-success/15 text-success",
    updated: "bg-update/15 text-update",
    accessed: "bg-warning/15 text-warning",
    deleted: "bg-danger/15 text-danger",
};

const FETCH_LIMIT = 80;

type ActivityFilter = "all" | "created" | "updated" | "accessed" | "deleted";

const FILTER_OPTIONS: { key: ActivityFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "created", label: "Creations" },
    { key: "updated", label: "Updates" },
    { key: "accessed", label: "Views" },
    { key: "deleted", label: "Deletes" },
];

const EMPTY_COPY: Record<ActivityFilter, { title: string; description: string }> = {
    all: {
        title: "No activity yet",
        description: "Events will appear when documents are created or changed.",
    },
    created: {
        title: "No recent creations",
        description: "Try another filter or check back later.",
    },
    updated: {
        title: "No recent updates",
        description: "Try another filter or check back later.",
    },
    accessed: {
        title: "No recent views",
        description: "Try another filter or check back later.",
    },
    deleted: {
        title: "No recent deletes",
        description: "Try another filter or check back later.",
    },
};

/** Scroll viewport: capped height; extra rows scroll inside. */
const LIST_MAX_H = "max-h-[min(360px,calc(55vh-8rem))]";
const LIST_SCROLL_CLASS = `${LIST_MAX_H} overflow-y-auto overscroll-y-contain pr-1`;

type ActivityFeedWidgetProps = {
    onInitialLoadComplete?: () => void;
};

export default function ActivityFeedWidget({ onInitialLoadComplete }: ActivityFeedWidgetProps) {
    const [events, setEvents] = useState<ActivityApiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityFilter>("all");
    const initialCompleteReported = useRef(false);
    const onInitialLoadCompleteRef = useRef(onInitialLoadComplete);
    onInitialLoadCompleteRef.current = onInitialLoadComplete;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const qs = new URLSearchParams({ limit: String(FETCH_LIMIT) });
                if (filter !== "all") qs.set("type", filter);
                const res = await fetch(`/api/activity?${qs.toString()}`, {
                    credentials: "include",
                });
                const json = (await res.json()) as { events?: ActivityApiEvent[] };
                const raw = json.events ?? [];
                const normalized = raw.map((e) => ({
                    ...e,
                    timestamp:
                        typeof e.timestamp === "string"
                            ? e.timestamp
                            : String(e.timestamp),
                }));
                const sorted = [...normalized].sort(
                    (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                );
                setEvents(sorted);
            } catch (e) {
                console.error("Activity feed failed", e);
                setEvents([]);
            } finally {
                setLoading(false);
                if (!initialCompleteReported.current) {
                    initialCompleteReported.current = true;
                    onInitialLoadCompleteRef.current?.();
                }
            }
        };
        load();
    }, [filter]);

    const display = useMemo(() => events.slice(0, 100), [events]);

    return (
        <div className="flex flex-col">
            <CardHeader className="shrink-0 space-y-2 pb-2">
                <div
                    className="flex flex-wrap justify-start gap-1"
                    role="toolbar"
                    aria-label="Filter by activity type"
                >
                    {FILTER_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            className={cn(
                                "rounded-md px-2 py-1 text-xs transition-colors",
                                filter === key
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div>
                    <CardTitle>Activity feed</CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                        Recent content actions, newest first
                    </p>
                </div>
            </CardHeader>
            <CardContent className="pb-0 pt-0">
                {loading ? (
                    <div
                        className={cn(
                            "flex min-h-[9rem] items-center justify-center py-6",
                            LIST_MAX_H
                        )}
                        aria-busy="true"
                        aria-label="Loading"
                    >
                        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
                    </div>
                ) : display.length === 0 ? (
                    <EmptyResultsState
                        className={cn("min-h-[8rem] py-10", LIST_MAX_H)}
                        title={EMPTY_COPY[filter].title}
                        description={EMPTY_COPY[filter].description}
                    />
                ) : (
                    <ul className={`space-y-0 ${LIST_SCROLL_CLASS}`} aria-label="Activity events">
                        {display.map((event, idx) => {
                            const Icon = TYPE_ICON[event.type] ?? Eye;
                            const iconBox = cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                TYPE_ICON_BG[event.type] ??
                                "bg-muted text-muted-foreground"
                            );
                            const { action, doc } = formatEventLine(event);
                            return (
                                <li
                                    key={`${event.contentId}-${event.type}-${event.timestamp}-${idx}`}
                                    className="flex gap-3 border-b border-border/60 py-2.5 last:border-b-0"
                                >
                                    <div className={iconBox}>
                                        <Icon className="size-4 shrink-0" aria-hidden />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="break-words text-sm leading-snug">
                                            <span className="text-foreground">{action}</span>{" "}
                                            <span className="font-medium text-foreground">
                                                “{doc}”
                                            </span>
                                        </p>
                                        <time
                                            className="mt-1 block text-xs text-muted-foreground"
                                            dateTime={event.timestamp}
                                        >
                                            {formatWhen(event.timestamp)}
                                        </time>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </div>
    );
}
