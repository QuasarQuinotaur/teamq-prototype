import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDays,
  format,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import { Badge } from "@/elements/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs.tsx";
import {
  AlertCircleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListTodoIcon,
} from "lucide-react";
import { Button } from "@/elements/buttons/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { Employee } from "db";

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

type ServiceRequestRow = {
  id: number;
  title: string | null;
  description: string | null;
  dateDue: string | null;
  status: string;
  employees: { id: number }[];
};

function isAssignedToUser(req: ServiceRequestRow, userId: number): boolean {
  return req.employees?.some((e) => e.id === userId) ?? false;
}

function isDoneStatus(status: string): boolean {
  return status.trim() === "done";
}

function parseDue(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = parseISO(iso);
  if (!isValid(d)) return null;
  return startOfDay(d);
}

function startOfToday(): Date {
  return startOfDay(new Date());
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

/** Month heading for the week strip (handles cross-month weeks). */
function weekBoardMonthLabel(weekDays: Date[]): string {
  const start = weekDays[0];
  const end = weekDays[6];
  if (format(start, "yyyy-MM") === format(end, "yyyy-MM")) {
    return format(start, "MMMM yyyy");
  }
  if (format(start, "yyyy") === format(end, "yyyy")) {
    return `${format(start, "MMMM")} – ${format(end, "MMMM yyyy")}`;
  }
  return `${format(start, "MMMM yyyy")} – ${format(end, "MMMM yyyy")}`;
}

/** Same buckets as stat cards / list: overdue, due in rolling 7-day window from today, or todo. */
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
      return "border-l-red-500";
    case "week":
      return "border-l-amber-400";
    case "todo":
      return "border-l-primary";
  }
}

const SERVICE_REQUESTS_PRESET_LINK = "/documents/service-requests";

// --- Stat card (2×2 grid) ---
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  className,
  to,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  className?: string;
  to?: string;
}) {
  const shellClass = cn(
    "flex min-h-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm",
    to &&
      "text-foreground no-underline transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );
  const inner = (
    <>
      <div className={cn("shrink-0 rounded-md p-1.5", accent)}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={shellClass}>
        {inner}
      </Link>
    );
  }
  return <div className={shellClass}>{inner}</div>;
}

function RequestListRow({ req, variant }: { req: ServiceRequestRow; variant: "overdue" | "week" | "todo" }) {
  const due = parseDue(req.dateDue);
  const editTo = `/documents/service-requests/${req.id}/edit`;

  return (
    <Link
      to={editTo}
      className={cn(
        "flex select-none items-center gap-3 rounded-lg border border-l-4 bg-card px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
        taskBorderAccent(variant)
      )}
    >
      <ListTodoIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {displayTitle(req)}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {variant === "overdue" && (
          <AlertCircleIcon className="size-3.5 text-red-500" aria-hidden />
        )}
        {due ? (
          <span
            className={cn(
              "text-xs tabular-nums",
              variant === "overdue"
                ? "text-red-600 dark:text-red-400"
                : variant === "week"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-hanover-blue"
            )}
          >
            {formatDue(due)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-lg border border-l-4 border-l-border bg-card px-4 py-2.5">
      <div className="size-4 shrink-0 rounded bg-muted" />
      <div className="h-4 flex-1 rounded bg-muted" />
      <div className="h-4 w-24 shrink-0 rounded bg-muted" />
    </div>
  );
}

const MAX_TASKS_PER_DAY = 3;

function WeekDayColumn({
  day,
  today,
  weekEnd,
  tasks,
}: {
  day: Date;
  today: Date;
  weekEnd: Date;
  tasks: ServiceRequestRow[];
}) {
  const visible = tasks.slice(0, MAX_TASKS_PER_DAY);
  const more = tasks.length - visible.length;

  const dueParam = format(day, "yyyy-MM-dd");
  const newRequestTo = `/documents/service-requests/new?due=${dueParam}`;
  const createLabel = `Create request due ${format(day, "MMM d, yyyy")}`;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col px-1">
      <Link
        to={newRequestTo}
        aria-label={createLabel}
        title={createLabel}
        className="absolute inset-0 z-0 rounded-md outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className="shrink-0 px-0.5 py-1 text-center">
          <p className="text-[0.65rem] font-medium leading-none text-muted-foreground">
            {format(day, "EEE")}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs font-semibold tabular-nums leading-none",
              isSameDay(day, today) && "text-hanover-blue"
            )}
          >
            {format(day, "d")}
          </p>
        </div>
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
          {visible.map((req) => {
            const due = parseDue(req.dateDue);
            const variant =
              due != null ? dueListVariant(due, today, weekEnd) : "todo";
            return (
              <Link
                key={req.id}
                to={`/documents/service-requests/${req.id}/edit`}
                title={displayTitle(req)}
                className={cn(
                  "pointer-events-auto truncate rounded-lg border border-l-4 bg-card px-1 py-0.5 text-left text-[0.65rem] leading-tight text-foreground transition-colors hover:bg-muted/50",
                  taskBorderAccent(variant)
                )}
              >
                {displayTitle(req)}
              </Link>
            );
          })}
          {more > 0 ? (
            <p className="truncate px-0.5 text-[0.6rem] text-muted-foreground">
              +{more} more
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WeekBoardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 divide-x divide-border overflow-hidden rounded-lg border border-border bg-card py-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex min-h-0 min-w-0 flex-1 flex-col px-1">
          <div className="mx-auto h-6 w-8 shrink-0 rounded bg-muted" />
          <div className="mt-1 flex flex-1 flex-col gap-1">
            <div className="h-4 rounded bg-muted/80" />
            <div className="h-4 rounded bg-muted/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [requests, setRequests] = useState<ServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedWeekStart, setDisplayedWeekStart] = useState(() =>
    startOfDay(startOfWeek(startOfToday(), { weekStartsOn: 0 }))
  );

  useEffect(() => {
    Promise.all([
      fetch(`${base}/me`, { credentials: "include" }).then((res) => {
        if (!res.ok) throw new Error("me");
        return res.json() as Promise<Employee>;
      }),
      fetch(`${base}/servicereqs/assigned/0`, { credentials: "include" }).then((res) =>
        res.ok ? res.json() : []
      ),
    ])
      .then(([me, data]) => {
        const rows = (Array.isArray(data) ? data : []) as ServiceRequestRow[];
        setRequests(rows.filter((r) => isAssignedToUser(r, me.id)));
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const today = startOfDay(new Date());
  const weekEnd = startOfDay(addDays(today, 6));
  const currentWeekStart = startOfDay(startOfWeek(today, { weekStartsOn: 0 }));
  const isViewingCurrentWeek = isSameDay(displayedWeekStart, currentWeekStart);
  const todayTime = today.getTime();

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        startOfDay(addDays(displayedWeekStart, i))
      ),
    [displayedWeekStart]
  );

  const weekBoardMonthLabelText = useMemo(
    () => weekBoardMonthLabel(weekDays),
    [weekDays]
  );

  const tasksByDay = useMemo(() => {
    const keys = new Set(weekDays.map((d) => format(d, "yyyy-MM-dd")));
    const map = new Map<string, ServiceRequestRow[]>();
    for (const d of weekDays) {
      map.set(format(d, "yyyy-MM-dd"), []);
    }
    for (const r of requests) {
      if (isDoneStatus(r.status)) continue;
      const due = parseDue(r.dateDue);
      if (!due) continue;
      const k = format(due, "yyyy-MM-dd");
      if (!keys.has(k)) continue;
      map.get(k)!.push(r);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const da = parseDue(a.dateDue)?.getTime() ?? 0;
        const db = parseDue(b.dateDue)?.getTime() ?? 0;
        if (da !== db) return da - db;
        return a.id - b.id;
      });
    }
    return map;
  }, [requests, weekDays]);

  const { counts, yourRequestsList, overdueList, dueWeekList, todoList } = useMemo(() => {
    let overdue = 0;
    let dueWeek = 0;
    let todo = 0;
    let done = 0;
    const yourRequestsItems: ServiceRequestRow[] = [];
    const overdueItems: ServiceRequestRow[] = [];
    const weekItems: ServiceRequestRow[] = [];
    const todoItems: ServiceRequestRow[] = [];

    for (const r of requests) {
      const finished = isDoneStatus(r.status);
      if (finished) {
        done += 1;
        continue;
      }
      yourRequestsItems.push(r);
      const due = parseDue(r.dateDue);
      if (due && due < today) {
        overdue += 1;
        overdueItems.push(r);
        continue;
      }
      if (due && due >= today && due <= weekEnd) {
        dueWeek += 1;
        weekItems.push(r);
        continue;
      }
      todo += 1;
      todoItems.push(r);
    }

    const sortByDueThenId = (a: ServiceRequestRow, b: ServiceRequestRow) => {
      const da = parseDue(a.dateDue)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseDue(b.dateDue)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (da !== db) return da - db;
      return a.id - b.id;
    };

    yourRequestsItems.sort(sortByDueThenId);
    overdueItems.sort((a, b) => {
      const da = parseDue(a.dateDue)?.getTime() ?? 0;
      const db = parseDue(b.dateDue)?.getTime() ?? 0;
      return da - db;
    });
    weekItems.sort((a, b) => {
      const da = parseDue(a.dateDue)?.getTime() ?? 0;
      const db = parseDue(b.dateDue)?.getTime() ?? 0;
      return da - db;
    });
    todoItems.sort(sortByDueThenId);

    return {
      counts: { todo, overdue, dueWeek, done },
      yourRequestsList: yourRequestsItems,
      overdueList: overdueItems,
      dueWeekList: weekItems,
      todoList: todoItems,
    };
  }, [requests, todayTime]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1 shrink-0" />
        </div>
        <div className="flex min-w-0 flex-1 justify-end" aria-hidden />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-6">
        {/* One third of the content area below the page header; no internal scrolling */}
        <div className="flex min-h-0 shrink-0 basis-1/3 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
            <div className="grid min-h-0 w-full shrink-0 grid-cols-2 grid-rows-[repeat(2,minmax(0,1fr))] gap-2 sm:gap-3 lg:h-full lg:max-w-[20rem]">
              <StatCard
                label="To do"
                value={counts.todo}
                icon={ListTodoIcon}
                accent="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                className="min-h-0"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=todo`}
              />
              <StatCard
                label="Done"
                value={counts.done}
                icon={CheckCircle2Icon}
                accent="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                className="min-h-0"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=done`}
              />
              <StatCard
                label="Due this week"
                value={counts.dueWeek}
                icon={CalendarDaysIcon}
                accent="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                className="min-h-0"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=week`}
              />
              <StatCard
                label="Overdue"
                value={counts.overdue}
                icon={AlertCircleIcon}
                accent="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                className="min-h-0"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=overdue`}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {loading ? (
                <WeekBoardSkeleton />
              ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label="Previous week"
                      onClick={() =>
                        setDisplayedWeekStart((d) => startOfDay(addDays(d, -7)))
                      }
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
                      {weekBoardMonthLabelText}
                    </span>
                    <div className="min-w-0 flex-1" aria-hidden />
                    {!isViewingCurrentWeek ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 px-2.5 text-xs"
                        onClick={() =>
                          setDisplayedWeekStart(
                            startOfDay(
                              startOfWeek(startOfDay(new Date()), {
                                weekStartsOn: 0,
                              })
                            )
                          )
                        }
                      >
                        This week
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label="Next week"
                      onClick={() =>
                        setDisplayedWeekStart((d) => startOfDay(addDays(d, 7)))
                      }
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-row divide-x divide-border overflow-hidden py-1">
                    {weekDays.map((day) => (
                      <WeekDayColumn
                        key={format(day, "yyyy-MM-dd")}
                        day={day}
                        today={today}
                        weekEnd={weekEnd}
                        tasks={tasksByDay.get(format(day, "yyyy-MM-dd")) ?? []}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tabs defaultValue="yours" className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="shrink-0">
              <p className="mb-2 text-sm font-medium text-foreground">
                Assigned to you
              </p>
              <TabsList className="grid h-auto w-full max-w-4xl grid-cols-2 gap-1.5 p-1 sm:h-9 sm:grid-cols-4 sm:gap-0">
                <TabsTrigger value="yours" className="gap-1 px-1.5 text-xs sm:gap-1.5 sm:text-sm">
                  Your requests
                  <Badge variant="secondary" className="tabular-nums">
                    {yourRequestsList.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="overdue" className="gap-1 px-1.5 text-xs sm:gap-1.5 sm:text-sm">
                  Overdue
                  <Badge variant="secondary" className="tabular-nums">
                    {counts.overdue}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1 px-1.5 text-xs sm:gap-1.5 sm:text-sm">
                  Due this week
                  <Badge variant="secondary" className="tabular-nums">
                    {counts.dueWeek}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="todo" className="gap-1 px-1.5 text-xs sm:gap-1.5 sm:text-sm">
                  To do
                  <Badge variant="secondary" className="tabular-nums">
                    {counts.todo}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="yours"
              className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden outline-none"
            >
              <div className="flex flex-col gap-1.5 pr-0.5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : yourRequestsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
                    <ListTodoIcon className="size-8 opacity-30" />
                    <p className="text-sm">No open requests assigned to you.</p>
                  </div>
                ) : (
                  yourRequestsList.map((req) => {
                    const due = parseDue(req.dateDue);
                    const v =
                      due == null ? "todo" : dueListVariant(due, today, weekEnd);
                    return <RequestListRow key={req.id} req={req} variant={v} />;
                  })
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="overdue"
              className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden outline-none"
            >
              <div className="flex flex-col gap-1.5 pr-0.5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`o-${i}`} />)
                ) : overdueList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
                    <AlertCircleIcon className="size-8 opacity-30" />
                    <p className="text-sm">No overdue assigned requests.</p>
                  </div>
                ) : (
                  overdueList.map((req) => (
                    <RequestListRow key={req.id} req={req} variant="overdue" />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="week"
              className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden outline-none"
            >
              <div className="flex flex-col gap-1.5 pr-0.5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`w-${i}`} />)
                ) : dueWeekList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
                    <CalendarDaysIcon className="size-8 opacity-30" />
                    <p className="text-sm">No assigned requests due this week.</p>
                  </div>
                ) : (
                  dueWeekList.map((req) => (
                    <RequestListRow key={req.id} req={req} variant="week" />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="todo"
              className="mt-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden outline-none"
            >
              <div className="flex flex-col gap-1.5 pr-0.5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`t-${i}`} />)
                ) : todoList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
                    <ListTodoIcon className="size-8 opacity-30" />
                    <p className="text-sm">Nothing in to do (no due date or due after this week).</p>
                  </div>
                ) : (
                  todoList.map((req) => (
                    <RequestListRow key={req.id} req={req} variant="todo" />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
