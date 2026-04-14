import * as React from "react";
import { Link } from "react-router-dom";
import { isValid, parseISO } from "date-fns";
import { ChevronDownIcon, MoreHorizontalIcon, PencilIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/elements/avatar.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { ConfettiHandle } from "../Confetti";
import { useRef } from "react";
import Confetti from "../Confetti";

const apiBase = `${import.meta.env.VITE_BACKEND_URL}/api`;

function isDoneStatus(status: string): boolean {
  return status.trim() === "done";
}

function formatDueDisplay(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = parseISO(iso);
  if (!isValid(d)) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type ServiceRequestAssignee = {
  id: string;
  name: string;
  imageSrc?: string;
};

export type ServiceRequestAssigner = {
  name: string;
  imageSrc?: string;
};

export type ServiceRequestCardProps = {
  id: string;
  title: string;
  description: string | null;
  dateDue: string | null;
  assignedBy: ServiceRequestAssigner;
  assignees: ServiceRequestAssignee[];
  status: string;
  onStatusUpdated?: (id: number, status: string) => void;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ServiceRequestCard({
  id,
  title,
  description,
  dateDue,
  assignedBy,
  assignees,
  status,
  onStatusUpdated,
  className,
}: ServiceRequestCardProps) {
  const [open, setOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const editTo = `/documents/service-requests/${id}/edit`;
  const numericId = Number(id);
  const done = isDoneStatus(status);

  const confettiRef = useRef<ConfettiHandle>(null);

  const descriptionText = description?.trim() ?? "";
  const dueLabel = formatDueDisplay(dateDue);

  async function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onStatusUpdated || updating || Number.isNaN(numericId)) return;
    const next = done ? "to-do" : "done";
    setUpdating(true);
    try {
      const res = await fetch(`${apiBase}/servicereqs/${numericId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body: unknown = await res.json();
      const newStatus =
        typeof body === "object" &&
        body !== null &&
        "status" in body &&
        typeof (body as { status: unknown }).status === "string"
          ? (body as { status: string }).status
          : next;
      if (newStatus === "done") {
        confettiRef.current?.fire();
      }
      onStatusUpdated(numericId, newStatus);
    } catch (err) {
      console.error("Failed to update service request status", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "select-none overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors",
          open && "ring-1 ring-ring/20",
          className
        )}
      >
        <div className="flex min-h-14 items-stretch gap-2">
          <Confetti ref={confettiRef}/>
          <button
            type="button"
            disabled={!onStatusUpdated || updating}
            aria-busy={updating}
            aria-pressed={done}
            aria-label={done ? "Mark request as to-do" : "Mark request as done"}
            onClick={toggleDone}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "ml-3 size-5 shrink-0 self-center rounded-full border-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-50",
              done
                ? "border-primary bg-primary"
                : "border-muted-foreground/40 bg-background hover:border-muted-foreground/60"
            )}
          />

          <CollapsibleTrigger asChild>
            <button
              type="button"
              aria-expanded={open}
              className={cn(
                "flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left outline-none",
                "hover:bg-muted/40",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              )}
            >
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-medium text-foreground",
                  done && "text-muted-foreground"
                )}
              >
                {title}
              </span>

              <AvatarGroup className="shrink-0">
                {assignees.map((a) => (
                  <Avatar key={a.id} size="sm" title={a.name}>
                    {a.imageSrc ? (
                      <AvatarImage src={a.imageSrc} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(a.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            </button>
          </CollapsibleTrigger>

          <div className="mr-2 flex shrink-0 items-center self-stretch">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label="Request options"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem asChild>
                  <Link to={editTo} className="flex cursor-pointer items-center gap-2">
                    <PencilIcon className="size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border bg-muted/15 px-3 py-3 text-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1 space-y-3">
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    dueLabel ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Due: {dueLabel ?? "No due date"}
                </p>
                <p className="whitespace-pre-wrap text-foreground">
                  {descriptionText ? descriptionText : "No description."}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Assigned by
                </p>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                  <Avatar size="default" title={assignedBy.name}>
                    {assignedBy.imageSrc ? (
                      <AvatarImage src={assignedBy.imageSrc} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(assignedBy.name)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
