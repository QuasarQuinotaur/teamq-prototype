import { useId, useMemo } from "react";
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

type ContentItem = {
    expirationDate: string;
};

const chartConfig = {
    count: {
        label: "Documents expiring",
        color: "var(--primary-foreground)",
    },
} satisfies ChartConfig;

function formatDayLabel(isoKey: string): string {
    const d = new Date(isoKey + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Props = {
    items: ContentItem[];
    loading?: boolean;
};

const LINE = "var(--primary)";

export default function DocumentExpirationLineWidget({ items, loading }: Props) {
    const gradId = useId().replace(/:/g, "");

    const data = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const last = new Date(today);
        last.setDate(last.getDate() + 30);

        const counts: Record<string, number> = {};
        for (const item of items) {
            const d = new Date(item.expirationDate);
            d.setHours(0, 0, 0, 0);
            if (d >= today && d <= last) {
                const key = d.toISOString().slice(0, 10);
                counts[key] = (counts[key] ?? 0) + 1;
            }
        }

        const rows: { date: string; label: string; count: number }[] = [];
        for (let i = 0; i <= 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            rows.push({
                date: key,
                label: formatDayLabel(key),
                count: counts[key] ?? 0,
            });
        }
        return rows;
    }, [items]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <CardHeader className="shrink-0 pb-2">
                <CardTitle>Document expirations by day</CardTitle>
                <p className="text-sm font-normal text-muted-foreground">
                    Next 30 days, per calendar day
                </p>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 pb-2">
                {loading ? (
                    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                        Loading…
                    </div>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="h-[min(220px,40vh)] w-full"
                    >
                        <ComposedChart
                            data={data}
                            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                        >
                            <defs>
                                <linearGradient
                                    id={gradId}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={LINE}
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={LINE}
                                        stopOpacity={0.02}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={6}
                                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                                interval={4}
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
                )}
            </CardContent>
        </div>
    );
}
