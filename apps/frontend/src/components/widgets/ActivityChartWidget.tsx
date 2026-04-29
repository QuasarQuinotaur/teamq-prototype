import { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

type ActivityEvent = {
    timestamp: string;
};

type Range = "Day" | "Week" | "Month" | "Year";

export default function ActivityChartWidget() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<Range>("Week");

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
                        "Jan","Feb","Mar","Apr","May","Jun",
                        "Jul","Aug","Sep","Oct","Nov","Dec"
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
            }
        };

        fetchData();
    }, [range]);

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-40 bg-gray-200 rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Activity Trend
                </h2>

                {/* Range buttons */}
                <div className="flex gap-1">
                    {["Day","Week","Month","Year"].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r as Range)}
                            className={`text-xs px-2 py-1 rounded-md ${
                                range === r
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart key={range} data={data}>
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #E5E7EB",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                padding: "8px 10px",
                            }}
                            labelStyle={{
                                color: "#6B7280",
                                fontSize: "12px",
                                marginBottom: "4px",
                            }}
                            itemStyle={{
                                color: "#111827",
                                fontWeight: 500,
                                fontSize: "13px",
                            }}
                            formatter={(value: number) => [`${value} events`, ""]}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#6366F1"
                            fill="#6366F1"
                            fillOpacity={0.2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}