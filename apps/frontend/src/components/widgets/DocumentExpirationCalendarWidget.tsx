import { useMemo, useState } from "react";
import {
    addDays,
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/elements/buttons/button.tsx";
import { CardContent, CardHeader, CardTitle } from "@/components/cards/Card.tsx";
import { cn } from "@/lib/utils.ts";

export type ExpirationContentItem = {
    id: number;
    title: string;
    expirationDate: string;
};

type Props = {
    items: ExpirationContentItem[];
    loading?: boolean;
};

function parseExpiration(iso: string): Date | null {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return startOfDay(d);
}

/** Red: expired. Orange: expires within 7 days from today (inclusive). Green: later. */
function expirationTone(expiration: Date, today: Date): "expired" | "soon" | "ok" {
    const exp = startOfDay(expiration);
    const t = startOfDay(today);
    if (exp < t) return "expired";
    const lastSoon = startOfDay(addDays(t, 6));
    if (exp <= lastSoon) return "soon";
    return "ok";
}

function toneClasses(tone: "expired" | "soon" | "ok"): string {
    if (tone === "expired") {
        return "border-l-red-500 bg-red-500/10 text-red-900 dark:text-red-100";
    }
    if (tone === "soon") {
        return "border-l-orange-500 bg-orange-500/10 text-orange-900 dark:text-orange-100";
    }
    return "border-l-emerald-600 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function DocumentExpirationCalendarWidget({ items, loading }: Props) {
    const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
    const today = startOfDay(new Date());

    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = useMemo(
        () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
        [gridStart, gridEnd]
    );

    const byDay = useMemo(() => {
        const map = new Map<string, ExpirationContentItem[]>();
        for (const item of items) {
            const d = parseExpiration(item.expirationDate);
            if (!d) continue;
            const key = format(d, "yyyy-MM-dd");
            const list = map.get(key);
            if (list) list.push(item);
            else map.set(key, [item]);
        }
        for (const [, list] of map) {
            list.sort((a, b) => a.title.localeCompare(b.title));
        }
        return map;
    }, [items]);

    if (loading) {
        return (
            <div className="flex h-full min-h-[280px] flex-col">
                <CardHeader className="shrink-0 pb-2 pl-8">
                    <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent className="min-h-0 flex-1">
                    <div className="grid grid-cols-7 gap-1 animate-pulse">
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded border bg-muted/40" />
                        ))}
                    </div>
                </CardContent>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <CardHeader className="shrink-0 space-y-1 pb-2 pl-8 pr-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Document expirations</CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Previous month"
                            onClick={() => setCursor(d => addMonths(d, -1))}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </Button>
                        <span className="min-w-[10rem] text-center text-sm font-semibold tabular-nums">
                            {format(cursor, "MMMM yyyy")}
                        </span>
                        <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Next month"
                            onClick={() => setCursor(d => addMonths(d, 1))}
                        >
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                    Red: expired · Orange: within 7 days · Green: later
                </p>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-2 pb-3 pt-0 sm:px-4">
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border">
                    {WEEKDAYS.map(d => (
                        <div
                            key={d}
                            className="bg-muted/50 px-1 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs"
                        >
                            {d}
                        </div>
                    ))}
                    {days.map(day => {
                        const key = format(day, "yyyy-MM-dd");
                        const dayItems = byDay.get(key) ?? [];
                        const inMonth = isSameMonth(day, cursor);
                        const isToday = isSameDay(day, today);

                        return (
                            <div
                                key={key}
                                className={cn(
                                    "flex min-h-[72px] flex-col bg-card p-1 sm:min-h-[88px]",
                                    !inMonth && "bg-muted/20 text-muted-foreground"
                                )}
                            >
                                <div
                                    className={cn(
                                        "mb-0.5 text-center text-[11px] font-semibold sm:text-xs",
                                        isToday &&
                                            "mx-auto flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                    )}
                                >
                                    {format(day, "d")}
                                </div>
                                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                                    {dayItems.slice(0, 4).map(item => {
                                        const exp = parseExpiration(item.expirationDate);
                                        const tone = exp
                                            ? expirationTone(exp, today)
                                            : "ok";
                                        return (
                                            <div
                                                key={item.id}
                                                title={item.title}
                                                className={cn(
                                                    "truncate rounded border border-l-[3px] px-1 py-px text-[9px] leading-tight sm:text-[10px]",
                                                    toneClasses(tone)
                                                )}
                                            >
                                                {item.title}
                                            </div>
                                        );
                                    })}
                                    {dayItems.length > 4 && (
                                        <div className="text-[9px] text-muted-foreground sm:text-[10px]">
                                            +{dayItems.length - 4} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </div>
    );
}
