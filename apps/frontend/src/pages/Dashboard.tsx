import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import ExpirationChart from "@/components/ExpirationChart.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/tabs.tsx";
import { Badge } from "@/elements/badge.tsx";
import { AlertCircleIcon, FileTextIcon, ClockIcon, TriangleAlertIcon } from "lucide-react";
import DocumentViewer from "@/components/DocumentViewer.tsx";

type ContentItem = {
    id: number;
    title: string;
    link: string;
    ownerName: string;
    jobPosition: string;
    contentType: string;
    status: string;
    dateAdded: string;
    dateUpdated: string;
    expirationDate: string;
};

function getUrgency(expirationDate: string): "overdue" | "soon" | "ok" {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate);
    exp.setHours(0, 0, 0, 0);
    if (exp < today) return "overdue";
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    if (exp <= sevenDays) return "soon";
    return "ok";
}

function formatExpiry(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

type ViewerState = {
    url: string;
    filename: string;
    title: string;
    contentId?: number;
};

async function resolveDocumentViewer(item: ContentItem): Promise<ViewerState | null> {
    const isStoragePath = !item.link.startsWith("http://") && !item.link.startsWith("https://");
    if (isStoragePath) {
        const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/content/${item.id}/download`,
            { credentials: "include" }
        );
        if (!res.ok) return null;
        const { url } = await res.json();
        const filename = item.link.split("/").pop() ?? item.title;
        return { url, filename, title: item.title, contentId: item.id };
    } else {
        const filename = item.link.split("/").pop()?.split("?")[0] ?? item.title;
        return { url: item.link, filename, title: item.title, contentId: item.id };
    }
}

// --- Stat Tile ---
function StatTile({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 flex-1 min-w-0">
            <div className={`rounded-lg p-2 ${accent}`}>
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-semibold leading-none tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
            </div>
        </div>
    );
}

// --- Compact Dashboard Card ---
function DashboardCard({ item, onOpen }: { item: ContentItem; onOpen: () => void }) {
    const urgency = getUrgency(item.expirationDate);

    const borderColor =
        urgency === "overdue"
            ? "border-l-red-500"
            : urgency === "soon"
              ? "border-l-amber-400"
              : "border-l-border";

    const expiryColor =
        urgency === "overdue"
            ? "text-red-500"
            : urgency === "soon"
              ? "text-amber-500"
              : "text-muted-foreground";

    return (
        <button
            onClick={onOpen}
            className={`w-full text-left flex items-center gap-3 rounded-lg border border-l-4 ${borderColor} bg-card px-4 py-2.5 hover:bg-muted/50 transition-colors`}
        >
            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium text-sm truncate">{item.title}</span>
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="hidden sm:inline-flex capitalize text-xs">
                    {item.contentType}
                </Badge>
                {urgency === "overdue" && (
                    <AlertCircleIcon className="size-3.5 text-red-500" />
                )}
                <span className={`text-xs tabular-nums ${expiryColor}`}>
                    {formatExpiry(item.expirationDate)}
                </span>
            </div>
        </button>
    );
}

// --- Skeleton row ---
function SkeletonRow() {
    return (
        <div className="w-full flex items-center gap-3 rounded-lg border border-l-4 border-l-border bg-card px-4 py-2.5 animate-pulse">
            <div className="size-4 rounded bg-muted shrink-0" />
            <div className="flex-1 h-4 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted shrink-0" />
        </div>
    );
}

// --- Empty state ---
function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <FileTextIcon className="size-8 opacity-30" />
            <p className="text-sm">No {label} documents</p>
        </div>
    );
}

// --- Tab count badge ---
function TabCount({ n }: { n: number }) {
    return (
        <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium leading-none text-muted-foreground min-w-[18px]">
            {n}
        </span>
    );
}

export default function Dashboard() {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewerItem, setViewerItem] = useState<ViewerState | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content`, { credentials: "include" })
            .then((res) => res.json())
            .then((data: ContentItem[]) => {
                const sorted = [...data].sort(
                    (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
                );
                setItems(sorted);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    async function handleOpenDocument(item: ContentItem) {
        const state = await resolveDocumentViewer(item);
        if (state) setViewerItem(state);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const overdue = items.filter((i) => new Date(i.expirationDate) < today);
    const dueSoon = items.filter((i) => {
        const exp = new Date(i.expirationDate);
        return exp >= today && exp <= sevenDays;
    });

    const todoItems = items.filter(
        (i) => i.status?.toLowerCase() === "todo" || i.status?.toLowerCase() === "to do"
    );
    const inProgressItems = items.filter(
        (i) => i.status?.toLowerCase() === "in-progress" || i.status?.toLowerCase() === "in progress"
    );

    if (viewerItem) {
        return (
            <DocumentViewer
                url={viewerItem.url}
                filename={viewerItem.filename}
                title={viewerItem.title}
                contentId={viewerItem.contentId}
                onClose={() => setViewerItem(null)}
            />
        );
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 relative">
                <SidebarTrigger className="-ml-1" />
            </header>

            <div className="flex flex-col gap-6 px-4 pb-8">
                {/* Stats row */}
                <div className="flex gap-3 flex-wrap">
                    <StatTile
                        label="Total Documents"
                        value={items.length}
                        icon={FileTextIcon}
                        accent="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    />
                    <StatTile
                        label="Expire This Week"
                        value={dueSoon.length}
                        icon={ClockIcon}
                        accent="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    />
                    <StatTile
                        label="Expired"
                        value={overdue.length}
                        icon={TriangleAlertIcon}
                        accent="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                    />
                </div>

                {/* Tabs: To Do / In Progress */}
                <Tabs defaultValue="todo">
                    <TabsList>
                        <TabsTrigger value="todo">
                            To Do
                            {!loading && <TabCount n={todoItems.length} />}
                        </TabsTrigger>
                        <TabsTrigger value="inprogress">
                            In Progress
                            {!loading && <TabCount n={inProgressItems.length} />}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="todo">
                        <div className="flex flex-col gap-1.5 mt-3 max-h-[420px] overflow-y-auto pr-0.5">
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                : todoItems.length === 0
                                  ? <EmptyState label="to-do" />
                                  : todoItems.map((item) => (
                                        <DashboardCard key={item.id} item={item} onOpen={() => handleOpenDocument(item)} />
                                    ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="inprogress">
                        <div className="flex flex-col gap-1.5 mt-3 max-h-[420px] overflow-y-auto pr-0.5">
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                : inProgressItems.length === 0
                                  ? <EmptyState label="in-progress" />
                                  : inProgressItems.map((item) => (
                                        <DashboardCard key={item.id} item={item} onOpen={() => handleOpenDocument(item)} />
                                    ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Expiration bar chart */}
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-medium mb-3">Documents Expiring — Next 30 Days</p>
                    {loading ? (
                        <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                            Loading chart…
                        </div>
                    ) : (
                        <ExpirationChart items={items} />
                    )}
                </div>
            </div>
        </>
    );
}
