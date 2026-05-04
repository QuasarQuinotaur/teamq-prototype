import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs.tsx";
import { EmptyResultsState } from "@/components/EmptyResultsState.tsx";
import { Badge } from "@/elements/badge.tsx";
import {
    ListTodoIcon,
    AlertCircleIcon,
    CalendarDaysIcon,
    Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { parseISO, isValid, startOfDay } from "date-fns";
import type { WorkflowListRow } from "@/components/service-requests/workflowTypes.ts";

// --- TYPES ---
type ServiceRequestRow = WorkflowListRow;

// --- HELPERS ---
function parseDue(iso: string | null): Date | null {
    if (!iso?.trim()) return null;
    const d = parseISO(iso);
    if (!isValid(d)) return null;
    return startOfDay(d);
}

function displayTitle(req: ServiceRequestRow): string {
    return (
        req.title?.trim() ||
        req.description?.trim() ||
        `Service request #${req.id}`
    );
}

function formatDue(d: Date): string {
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function dueListVariant(
    due: Date,
    today: Date,
    weekEnd: Date
): "overdue" | "week" | "todo" {
    if (due < today) return "overdue";
    if (due <= weekEnd) return "week";
    return "todo";
}

function taskBorderAccent(variant: "overdue" | "week" | "todo"): string {
    switch (variant) {
        case "overdue":
            return "border-l-danger";
        case "week":
            return "border-l-warning";
        default:
            return "border-l-success";
    }
}

// --- MAIN COMPONENT ---
export default function ServiceRequests({
                                            loading,
                                            counts,
                                            yourRequestsList,
                                            overdueList,
                                            dueWeekList,
                                            todoList,
                                            today,
                                            weekEnd,
                                        }) {
    return (
        <section className="flex h-full w-full flex-col overflow-hidden">
            <Tabs defaultValue="yours" className="flex h-full min-h-0 flex-col gap-3">

                {/* HEADER */}
                <div className="shrink-0 py-4">
                    <p className="mb-2 text-sm font-medium">Assigned to you</p>

                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                        <TabsTrigger value="yours">
                            Your requests
                            <CountBadge loading={loading} count={yourRequestsList.length} />
                        </TabsTrigger>

                        <TabsTrigger value="overdue">
                            Overdue
                            <CountBadge loading={loading} count={counts.overdue} />
                        </TabsTrigger>

                        <TabsTrigger value="week">
                            Due this week
                            <CountBadge loading={loading} count={counts.dueWeek} />
                        </TabsTrigger>

                        <TabsTrigger value="todo">
                            To do
                            <CountBadge loading={loading} count={counts.todo} />
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* CONTENT */}
                <TabsContent value="yours" className="flex-1 min-h-0 overflow-y-auto">
                    <ListSection
                        loading={loading}
                        items={yourRequestsList}
                        today={today}
                        weekEnd={weekEnd}
                    />
                </TabsContent>

                <TabsContent value="overdue" className="flex-1 min-h-0 overflow-y-auto">
                    <ListSection loading={loading} items={overdueList} variant="overdue" />
                </TabsContent>

                <TabsContent value="week" className="flex-1 min-h-0 overflow-y-auto">
                    <ListSection loading={loading} items={dueWeekList} variant="week" />
                </TabsContent>

                <TabsContent value="todo" className="flex-1 min-h-0 overflow-y-auto">
                    <ListSection loading={loading} items={todoList} variant="todo" />
                </TabsContent>
            </Tabs>
        </section>
    );
}

function CountBadge({ loading, count }: { loading: boolean; count: number }) {
    if (loading) {
        return (
            <Badge variant="secondary" className="min-w-8 justify-center px-1.5">
                <Loader2 className="mx-auto size-3.5 animate-spin" aria-hidden />
            </Badge>
        );
    }
    return <Badge variant="secondary">{count}</Badge>;
}

// --- LIST SECTION ---
function ListSection({
                         loading,
                         items,
                         variant,
                         today,
                         weekEnd,
                     }: {
    loading: boolean;
    items: ServiceRequestRow[];
    variant?: "overdue" | "week" | "todo";
    today?: Date;
    weekEnd?: Date;
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            {loading ? (
                <div
                    className="flex flex-1 items-center justify-center py-12"
                    aria-busy="true"
                    aria-label="Loading"
                >
                    <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
                </div>
            ) : items.length === 0 ? (
                <EmptyResultsState
                    className="flex-1 py-12"
                    title="No requests"
                    description="Nothing in this list yet. Try another tab or check back later."
                />
            ) : (
                items.map((req) => {
                    let v = variant;

                    if (!v && today && weekEnd) {
                        const due = parseDue(req.dateDue);
                        v = due ? dueListVariant(due, today, weekEnd) : "todo";
                    }

                    return (
                        <RequestListRow
                            key={req.id}
                            req={req}
                            variant={v ?? "todo"}
                        />
                    );
                })
            )}
        </div>
    );
}

// --- ROW ---
function RequestListRow({
                            req,
                            variant,
                        }: {
    req: ServiceRequestRow;
    variant: "overdue" | "week" | "todo";
}) {
    const due = parseDue(req.dateDue);

    return (
        <Link
            to={`/documents/service-requests/${req.id}/edit`}
            className={cn(
                "flex items-center gap-3 rounded-lg border border-l-4 bg-card px-4 py-2.5 hover:bg-muted/50",
                taskBorderAccent(variant)
            )}
        >
            <ListTodoIcon className="size-4 text-muted-foreground" />

            <span className="flex-1 truncate text-sm font-medium">
                {displayTitle(req)}
            </span>

            {due && (
                <span
                    className={cn(
                        "text-xs",
                        variant === "overdue"
                            ? "text-danger"
                            : variant === "week"
                                ? "text-warning"
                                : "text-success"
                    )}
                >
                    {formatDue(due)}
                </span>
            )}
        </Link>
    );
}