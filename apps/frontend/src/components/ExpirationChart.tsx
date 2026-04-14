import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/Chart.tsx";

type ContentItem = {
    id: number;
    title: string;
    expirationDate: string;
    [key: string]: unknown;
};

type Props = {
    items: ContentItem[];
};

const chartConfig = {
    count: {
        label: "Documents",
        color: "#3b82f6",
    },
} satisfies ChartConfig;

function formatDay(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ExpirationChart({ items }: Props) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 30);

    const counts: Record<string, number> = {};
    for (const item of items) {
        const d = new Date(item.expirationDate);
        d.setHours(0, 0, 0, 0);
        if (d >= today && d <= cutoff) {
            const key = d.toISOString().slice(0, 10);
            counts[key] = (counts[key] ?? 0) + 1;
        }
    }

    // Always include every day in the 30-day range, even if count is 0
    const data: { date: string; label: string; count: number }[] = [];
    for (let i = 0; i <= 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        data.push({ date: key, label: formatDay(key), count: counts[key] ?? 0 });
    }

    return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    width={28}
                />
                <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    );
}
