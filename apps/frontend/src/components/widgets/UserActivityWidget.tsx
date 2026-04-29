import { useEffect, useId, useMemo, useState } from "react";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
} from "recharts";
import { Activity } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/cards/Card.tsx";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/Chart.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";

type ActivityEvent = {
    timestamp: string;
};

const LINE = "#2563eb";

const chartConfig = {
    count: {
        label: "Events",
        color: LINE,
    },
} satisfies ChartConfig;

function startOfWeekMonday(from: Date): Date {
    const day = from.getDay();
    const diff = from.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(from);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
}

function localDayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatChartDayLabel(isoKey: string): string {
    const d = new Date(isoKey + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const FILTER_OPTIONS = [
    { key: "all", label: "All" },
    { key: "created", label: "Creations" },
    { key: "updated", label: "Updates" },
    { key: "accessed", label: "Views" },
    { key: "deleted", label: "Deletes" },
] as const;

export default function UserActivityWidget() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const gradId = useId().replace(/:/g, "");

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const start = startOfWeekMonday(now);

                const typeParam = filter !== "all" ? `&type=${filter}` : "";

                const res = await fetch(
                    `/api/activity?since=${start.toISOString()}${typeParam}`,
                    { credentials: "include" }
                );

                const data = await res.json();
                setEvents(data.events || []);
            } catch (err) {
                console.error("Failed to fetch activity", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [filter]);

    const chartData = useMemo(() => {
        const weekStart = startOfWeekMonday(new Date());
        const counts: Record<string, number> = {};
        for (const e of events) {
            const d = new Date(e.timestamp);
            const key = localDayKey(d);
            counts[key] = (counts[key] ?? 0) + 1;
        }
        const rows: { date: string; label: string; count: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            const key = localDayKey(d);
            rows.push({
                date: key,
                label: formatChartDayLabel(key),
                count: counts[key] ?? 0,
            });
        }
        return rows;
    }, [events]);

    if (loading) {
        return (
            <div className="flex h-full min-h-0 flex-col">
                <CardHeader className="shrink-0 pb-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="h-6 w-44" />
                    </div>
                    <Skeleton className="mt-2 h-4 w-64" />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {FILTER_OPTIONS.map((b) => (
                            <Skeleton key={b.key} className="h-6 w-[4.5rem] rounded-lg" />
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 pb-2">
                    <Skeleton className="h-[min(220px,40vh)] w-full rounded-lg" />
                </CardContent>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <CardHeader className="shrink-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                    <Activity className="size-4 text-muted-foreground" />
                    User activity
                </CardTitle>
                <p className="text-sm font-normal text-muted-foreground">
                    This week, events per calendar day
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                    {FILTER_OPTIONS.map((btn) => (
                        <Button
                            key={btn.key}
                            type="button"
                            variant={filter === btn.key ? "default" : "outline"}
                            size="xs"
                            onClick={() => setFilter(btn.key)}
                            className="rounded-lg"
                        >
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 pb-2">
                <ChartContainer
                    config={chartConfig}
                    className="h-[min(220px,40vh)] w-full"
                >
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={LINE} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={LINE} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={6}
                            tick={{ fontSize: 10 }}
                            interval={0}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            tick={{ fontSize: 11 }}
                            width={32}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                            cursor={{
                                stroke: "hsl(var(--border))",
                                strokeWidth: 1,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="none"
                            fill={`url(#${gradId})`}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke={LINE}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: LINE }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </div>
    );
}
