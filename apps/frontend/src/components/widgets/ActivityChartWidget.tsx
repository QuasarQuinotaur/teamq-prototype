import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
} from "recharts";
import { CardContent, CardHeader, CardTitle } from "@/components/cards/Card.tsx";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/Chart.tsx";
import { Loader2 } from "lucide-react";

type ActivityEvent = {
    timestamp: string;
};

type Range = "Day" | "Week" | "Month" | "Year";

const chartConfig = {
    count: {
        label: "Events",
        color: "var(--primary-foreground)",
    },
} satisfies ChartConfig;

const LINE = "var(--primary-foreground)";

function xAxisInterval(pointCount: number): number {
    if (pointCount <= 8) return 0;
    if (pointCount <= 16) return 2;
    if (pointCount <= 24) return 3;
    return Math.max(0, Math.floor(pointCount / 6));
}

type ActivityChartWidgetProps = {
    onInitialLoadComplete?: () => void;
};

export default function ActivityChartWidget({ onInitialLoadComplete }: ActivityChartWidgetProps) {
    const gradId = useId().replace(/:/g, "");
    const [data, setData] = useState<{ label: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<Range>("Week");
    const initialCompleteReported = useRef(false);
    const onInitialLoadCompleteRef = useRef(onInitialLoadComplete);
    onInitialLoadCompleteRef.current = onInitialLoadComplete;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const now = new Date();
                let start = new Date();

                if (range === "Day") {
                    start.setHours(0, 0, 0, 0);
                } else if (range === "Week") {
                    const day = now.getDay();
                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                    start.setDate(diff);
                    start.setHours(0, 0, 0, 0);
                } else if (range === "Month") {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                } else if (range === "Year") {
                    start = new Date(now.getFullYear(), 0, 1);
                }

                const res = await fetch(
                    `/api/activity?since=${start.toISOString()}`,
                    { credentials: "include" }
                );

                const json = await res.json();
                const events: ActivityEvent[] = json.events || [];

                const counts: Record<string, number> = {};

                events.forEach((e) => {
                    const d = new Date(e.timestamp);
                    let key = "";

                    if (range === "Day") {
                        const hour = d.getHours();
                        const h = hour % 12 || 12;
                        const ampm = hour < 12 ? "AM" : "PM";
                        key = `${h} ${ampm}`;
                    } else if (range === "Week") {
                        key = d.toLocaleDateString("en-US", { weekday: "short" });
                    } else if (range === "Month") {
                        key = `${d.getDate()}`;
                    } else if (range === "Year") {
                        key = d.toLocaleDateString("en-US", { month: "short" });
                    }

                    counts[key] = (counts[key] || 0) + 1;
                });

                let labels: string[] = [];

                if (range === "Day") {
                    labels = Array.from({ length: 24 }, (_, i) => {
                        const h = i % 12 || 12;
                        const ampm = i < 12 ? "AM" : "PM";
                        return `${h} ${ampm}`;
                    });
                } else if (range === "Week") {
                    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                } else if (range === "Month") {
                    const daysInMonth = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                    ).getDate();

                    labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
                } else if (range === "Year") {
                    labels = [
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                    ];
                }

                const chartData = labels.map((l) => ({
                    label: l,
                    count: counts[l] || 0,
                }));

                setData(chartData);
            } catch (err) {
                console.error("chart error", err);
            } finally {
                setLoading(false);
                if (!initialCompleteReported.current) {
                    initialCompleteReported.current = true;
                    onInitialLoadCompleteRef.current?.();
                }
            }
        };

        fetchData();
    }, [range]);

    const axisInterval = useMemo(() => xAxisInterval(data.length), [data.length]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <CardHeader className="shrink-0 pb-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Activity</CardTitle>
                        <p className="text-sm font-normal text-muted-foreground">
                            Content events over the selected range
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                        {(["Day", "Week", "Month", "Year"] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRange(r)}
                                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                                    range === r
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 pb-2">
                {loading ? (
                    <div
                        className="flex h-[min(220px,40vh)] w-full items-center justify-center"
                        aria-busy="true"
                        aria-label="Loading"
                    >
                        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="h-[min(220px,40vh)] w-full"
                    >
                        <ComposedChart
                            key={range}
                            data={data}
                            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                        >
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                stroke="var(--border)"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={6}
                                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                                interval={axisInterval}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                width={32}
                            />
                            <ChartTooltip
                                content={<ChartTooltipContent />}
                                cursor={{
                                    stroke: "var(--border)",
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
                                stroke="var(--primary)"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "var(--primary)" }}
                            />
                        </ComposedChart>
                    </ChartContainer>
                )}
            </CardContent>
        </div>
    );
}