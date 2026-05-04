import { useMemo, useState } from "react";
import {
    addDays,
    format,
    isSameDay,
    startOfDay,
    startOfWeek,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/elements/buttons/button.tsx";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import type { WorkflowListRow } from "@/components/service-requests/workflowTypes.ts";

// --- TYPES ---
type ServiceRequestRow = WorkflowListRow;

// --- HELPERS ---
function parseDue(date: string | null): Date | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return startOfDay(d);
}

function displayTitle(req: ServiceRequestRow) {
    return (
        req.title?.trim() ||
        req.description?.trim() ||
        `Request #${req.id}`
    );
}

function weekLabel(days: Date[]) {
    const start = days[0];
    const end = days[6];

    if (format(start, "yyyy-MM") === format(end, "yyyy-MM")) {
        return format(start, "MMMM yyyy");
    }
    return `${format(start, "MMM")} – ${format(end, "MMM yyyy")}`;
}

function variant(due: Date, today: Date, weekEnd: Date) {
    if (due < today) return "overdue";
    if (due <= weekEnd) return "week";
    return "todo";
}

function border(variant: string) {
    if (variant === "overdue") return "border-danger";
    if (variant === "week") return "border-l-warning";
    return "border-l-primary";
}

// --- MAIN ---
export default function WeekCalendar({
                                         requests,
                                         loading,
                                     }: {
    requests: ServiceRequestRow[];
    loading: boolean;
}) {
    const today = startOfDay(new Date());
    const weekEnd = startOfDay(addDays(today, 6));

    const [weekStart, setWeekStart] = useState(
        startOfDay(startOfWeek(today, { weekStartsOn: 0 }))
    );

    const weekDays = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) =>
                startOfDay(addDays(weekStart, i))
            ),
        [weekStart]
    );

    const tasksByDay = useMemo(() => {
        const map = new Map<string, ServiceRequestRow[]>();

        weekDays.forEach((d) => {
            map.set(format(d, "yyyy-MM-dd"), []);
        });

        requests.forEach((r) => {
            if (r.status === "done") return;

            const due = parseDue(r.dateDue);
            if (!due) return;

            const key = format(due, "yyyy-MM-dd");
            if (map.has(key)) {
                map.get(key)!.push(r);
            }
        });

        return map;
    }, [requests, weekDays]);

    if (loading) return <WeekSkeleton />;

    return (
        <div className="flex flex-1 flex-col overflow-hidden min-h-75">

            {/* HEADER — pl-8 leaves room for the floating drag grip */}
            <div className="flex items-center pl-8 pr-2 py-1.5 border-b">
                <Button size="icon" variant="ghost" onClick={() => setWeekStart(d => addDays(d, -7))}>
                    <ChevronLeftIcon className="size-4" />
                </Button>

                <span className="font-semibold text-sm">
          {weekLabel(weekDays)}
        </span>

                <div className="flex-1" />

                <Button size="icon" variant="ghost" onClick={() => setWeekStart(d => addDays(d, 7))}>
                    <ChevronRightIcon className="size-4" />
                </Button>
            </div>

            {/* DAYS */}
            <div className="flex flex-1 divide-x">
                {weekDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const tasks = tasksByDay.get(key) || [];

                    return (
                        <DayColumn
                            key={key}
                            day={day}
                            tasks={tasks}
                            today={today}
                            weekEnd={weekEnd}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// --- DAY COLUMN ---
function DayColumn({ day, tasks, today, weekEnd }) {
    return (
        <div className="flex flex-1 flex-col p-1 relative">

            {/* clickable background */}
            <Link
                to={`/documents/service-requests/new?due=${format(day, "yyyy-MM-dd")}`}
                className="absolute inset-0 hover:bg-muted/30"
            />

            <div className="relative z-10 flex flex-col">

                {/* header */}
                <div className="text-center text-xs">
                    <div className="text-muted-foreground">{format(day, "EEE")}</div>
                    <div className={cn("font-semibold", isSameDay(day, today) && "text-danger")}>
                        {format(day, "d")}
                    </div>
                </div>

                {/* tasks */}
                <div className="mt-1 flex flex-col gap-1">
                    {tasks.slice(0, 3).map((req) => {
                        const due = parseDue(req.dateDue);
                        const v = due ? variant(due, today, weekEnd) : "todo";

                        return (
                            <Link
                                key={req.id}
                                to={`/documents/service-requests/${req.id}/edit`}
                                className={cn(
                                    "truncate text-xs px-1 py-0.5 rounded border border-l-4 bg-card hover:bg-muted/50",
                                    border(v)
                                )}
                            >
                                {displayTitle(req)}
                            </Link>
                        );
                    })}

                    {tasks.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                            +{tasks.length - 3} more
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SKELETON ---
function WeekSkeleton() {
    return (
        <div className="flex flex-1 border rounded-lg">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 p-2 animate-pulse">
                    <div className="h-4 w-6 bg-muted mx-auto mb-2 rounded" />
                    <div className="h-3 bg-muted rounded mb-1" />
                    <div className="h-3 bg-muted rounded" />
                </div>
            ))}
        </div>
    );
}