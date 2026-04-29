import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2, Activity } from "lucide-react";

type ActivityEvent = {
    type: "created" | "updated" | "accessed" | "deleted";
    contentId: number;
    contentTitle: string;
    employeeId: number | null;
    employeeName: string | null;
    timestamp: string;
};

export default function UserActivityWidget({ limit = 10 }: { limit?: number }) {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const now = new Date();
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                const start = new Date(now);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);

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
    }, [limit, filter]);

    // ⏱ time formatting
    function timeAgo(dateStr: string) {
        const date = new Date(dateStr);
        const diff = (Date.now() - date.getTime()) / 1000;

        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    // 🎨 type mapping
    const typeMap = {
        created: {
            icon: Plus,
            color: "text-green-500",
            label: "created",
        },
        updated: {
            icon: Pencil,
            color: "text-yellow-500",
            label: "updated",
        },
        accessed: {
            icon: Eye,
            color: "text-gray-400",
            label: "viewed",
        },
        deleted: {
            icon: Trash2,
            color: "text-red-500",
            label: "deleted",
        },
    };

    // 🧩 Skeleton
    if (loading) {
        return (
            <div className="p-4 space-y-3">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />

                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <div className="flex gap-2 items-center w-full">
                            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                User Activity (This Week)
            </h2>

            {/* Filters */}
            <div className="flex gap-2 mb-3">
                {[
                    { key: "all", label: "All" },
                    { key: "created", label: "Creations" },
                    { key: "updated", label: "Updates" },
                    { key: "accessed", label: "Views" },
                    { key: "deleted", label: "Deletes" },
                ].map((btn) => (
                    <button
                        key={btn.key}
                        onClick={() => setFilter(btn.key)}
                        className={`text-xs px-2 py-1 rounded-md border ${
                            filter === btn.key
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {events.map((event, i) => {
                    const map = typeMap[event.type];
                    const Icon = map.icon;

                    return (
                        <div
                            key={i}
                            className="flex justify-between items-center py-1.5"
                        >
                            {/* Left */}
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Icon className={`w-4 h-4 ${map.color}`} />

                                <span className="text-sm text-gray-700 truncate">
                                    <span className="font-medium">
                                        {event.employeeName || "Someone"}
                                    </span>{" "}
                                    {map.label}{" "}
                                    <span className="font-medium">
                                        "{event.contentTitle}"
                                    </span>
                                </span>
                            </div>

                            {/* Right */}
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                {timeAgo(event.timestamp)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}