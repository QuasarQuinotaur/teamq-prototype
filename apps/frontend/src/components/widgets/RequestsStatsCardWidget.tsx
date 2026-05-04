import { ListTodoIcon, CheckCircle2Icon, CalendarDaysIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import {cn} from "@/lib/utils.ts";
import {Link} from "react-router-dom"; // or keep in same file if you want

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

export default function StatsCards({ counts, loading }: { counts: any; loading?: boolean }) {
    if (loading) {
        return (
            <div
                className="grid h-full w-full place-items-center"
                aria-busy="true"
                aria-label="Loading"
            >
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
            </div>
        );
    }

    return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2">
            <StatCard
                label="To do"
                value={counts.todo}
                icon={ListTodoIcon}
                accent="bg-muted text-update"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=todo`}
            />
            <StatCard
                label="Done"
                value={counts.done}
                icon={CheckCircle2Icon}
                accent="bg-muted text-success"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=done`}
            />
            <StatCard
                label="Due this week"
                value={counts.dueWeek}
                icon={CalendarDaysIcon}
                accent="bg-muted text-warning"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=week`}
            />
            <StatCard
                label="Overdue"
                value={counts.overdue}
                icon={AlertCircleIcon}
                accent="bg-muted text-danger"
                to={`${SERVICE_REQUESTS_PRESET_LINK}?preset=overdue`}
            />
        </div>
    );
}

