import * as React from "react";
import { Link } from "react-router-dom";
import { isValid, parseISO } from "date-fns";
import {
  FileIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/dialog/AlertDialog.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
} from "@/elements/avatar.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { ConfettiHandle } from "../Confetti";
import { useRef } from "react";
import Confetti from "../Confetti";
import type { WorkflowPayload, WorkflowStagePayload } from "@/components/service-requests/workflowTypes.ts";
import {
  allEmployeesUnion,
  isDoneStatus,
  rollupWorkflowStatus,
  sortedStages,
  stageToggleBlockedReason,
} from "@/components/service-requests/workflowTypes.ts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/elements/tooltip.tsx";

const apiBase = `${import.meta.env.VITE_BACKEND_URL}/api`;

/** Visual size for stage check-off dots (header + vertical timeline); hit area stays tappable. */
const stageDotHitClass = "flex h-8 w-8 shrink-0 items-center justify-center";
const stageDotInnerClass = "size-5 rounded-full border-2";

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

export type ServiceRequestLinkedDocument = {
  id: number;
  title: string;
  filePath: string | null;
};

export type ServiceRequestCardProps = {
  workflow: WorkflowPayload;
  currentUserId: number;
  /** Row title (workflow / fallback) */
  title: string;
  /** Rollup description for collapsed summary */
  summaryDescription: string | null;
  /** Rollup due */
  summaryDue: string | null;
  onLinkedDocumentOpen: (doc: ServiceRequestLinkedDocument) => void;
  onStageStatusUpdated?: (workflowId: number, stageId: number, status: string) => void;
  onDeleted?: (workflowId: number) => void;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stageLabel(st: WorkflowStagePayload): string {
  return st.title?.trim() || "Untitled stage";
}

function employeeToAssignee(e: {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}): ServiceRequestAssignee {
  return {
    id: String(e.id),
    name: `${e.firstName} ${e.lastName}`.trim(),
    imageSrc: e.profileImageUrl,
  };
}

export function ServiceRequestCard({
  workflow,
  currentUserId,
  title,
  summaryDescription,
  summaryDue,
  onLinkedDocumentOpen,
  onStageStatusUpdated,
  onDeleted,
  className,
}: ServiceRequestCardProps) {
  const [open, setOpen] = React.useState(false);
  const [updatingStageId, setUpdatingStageId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const workflowNumericId = workflow.id;
  const editTo = `/documents/service-requests/${workflowNumericId}/edit`;

  const ordered = React.useMemo(() => sortedStages(workflow.stages), [workflow.stages]);
  const rollupDone = rollupWorkflowStatus(ordered) === "done";
  const onlyStage = ordered.length === 1 ? ordered[0]! : null;
  const singleStageMeta =
    onlyStage == null
      ? null
      : (() => {
          const stageDone = isDoneStatus(onlyStage.status);
          const nextTarget: "done" | "to-do" = stageDone ? "to-do" : "done";
          return {
            stageDone,
            blocked: stageToggleBlockedReason(
              ordered,
              0,
              currentUserId,
              nextTarget,
            ),
            busy: updatingStageId === onlyStage.id,
          };
        })();

  const confettiRef = useRef<ConfettiHandle>(null);

  const descriptionText = summaryDescription?.trim() ?? "";
  const dueLabel = formatDueDisplay(summaryDue);

  async function toggleStageStatus(stage: WorkflowStagePayload, stageIndex: number) {
    if (!onStageStatusUpdated || updatingStageId != null) return;
    const nextDone = !isDoneStatus(stage.status);
    const nextStatus = nextDone ? "done" : "to-do";
    const reason = stageToggleBlockedReason(ordered, stageIndex, currentUserId, nextStatus);
    if (reason != null) return;

    setUpdatingStageId(stage.id);
    try {
      const res = await fetch(`${apiBase}/servicereqs/stage/${stage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      const nextStages = ordered.map((s) =>
        s.id === stage.id ? { ...s, status: nextStatus } : s,
      );
      const wasAllDone = rollupWorkflowStatus(ordered) === "done";
      const nowAllDone = rollupWorkflowStatus(nextStages) === "done";
      if (!wasAllDone && nowAllDone) {
        confettiRef.current?.fire();
      }
      onStageStatusUpdated(workflowNumericId, stage.id, nextStatus);
    } catch (err) {
      console.error("Failed to update stage status", err);
    } finally {
      setUpdatingStageId(null);
    }
  }

  async function performDelete() {
    if (!onDeleted || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}/servicereqs/workflow/${workflowNumericId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      onDeleted(workflowNumericId);
    } catch (err) {
      console.error("Failed to delete workflow", err);
    } finally {
      setDeleting(false);
    }
  }

  const combinedAssignees = React.useMemo(
    () => allEmployeesUnion(ordered).map(employeeToAssignee),
    [ordered],
  );

  const assignedBy = {
    name: `${workflow.owner.firstName} ${workflow.owner.lastName}`.trim(),
    imageSrc: workflow.owner.profileImageUrl,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div
          className={cn(
            "select-none overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors",
            open && "ring-1 ring-ring/20",
            className,
          )}
        >
          <Confetti ref={confettiRef} />
          <div className="flex min-h-[3.75rem] flex-col gap-2 py-2">
            <div className="flex min-h-14 items-center gap-2 pr-2">
              <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-2 pl-3">
                <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3">
                    {onlyStage != null && singleStageMeta ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-pressed={singleStageMeta.stageDone}
                            aria-busy={singleStageMeta.busy}
                            aria-label={
                              singleStageMeta.stageDone
                                ? "Mark stage as not done"
                                : "Mark stage as done"
                            }
                            title={singleStageMeta.blocked ?? undefined}
                            disabled={
                              !onStageStatusUpdated ||
                              singleStageMeta.busy ||
                              singleStageMeta.blocked != null
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              void toggleStageStatus(onlyStage, 0);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={cn(
                              stageDotHitClass,
                              "rounded-full",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              "disabled:pointer-events-none disabled:opacity-40",
                            )}
                          >
                            <span
                              className={cn(
                                "flex items-center justify-center",
                                stageDotInnerClass,
                                singleStageMeta.stageDone
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/50 bg-background",
                              )}
                            >
                              {singleStageMeta.busy ? (
                                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50" />
                              ) : null}
                            </span>
                          </button>
                        </TooltipTrigger>
                        {singleStageMeta.blocked ? (
                          <TooltipContent side="top" className="max-w-xs">
                            {singleStageMeta.blocked}
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                    ) : (
                      <span
                        className={cn(stageDotHitClass)}
                        aria-hidden
                        title={rollupDone ? "All stages complete" : "In progress"}
                      >
                        <span
                          className={cn(
                            stageDotInnerClass,
                            "shrink-0",
                            rollupDone
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/50 bg-background",
                          )}
                        />
                      </span>
                    )}
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        aria-expanded={open}
                        className={cn(
                          "flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md px-2 py-0 text-left outline-none",
                          "hover:bg-muted/40",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        )}
                      >
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-lg font-semibold leading-tight text-foreground",
                            rollupDone && "text-muted-foreground",
                          )}
                        >
                          {title}
                        </span>
                        <AvatarGroup className="shrink-0">
                          {combinedAssignees.map((a) => (
                            <Tooltip key={a.id}>
                              <TooltipTrigger asChild>
                                <Avatar size="sm" aria-label={a.name}>
                                  {a.imageSrc ? (
                                    <AvatarImage src={a.imageSrc} alt="" />
                                  ) : null}
                                  <AvatarFallback>{initials(a.name)}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="top">{a.name}</TooltipContent>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </button>
                    </CollapsibleTrigger>
                </div>
              </div>

              <div className="flex min-h-14 shrink-0 items-center self-center">
                <AlertDialog>
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
                      <DropdownMenuSeparator />
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!onDeleted || deleting}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Trash2Icon className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={deleting}
                        onClick={() => void performDelete()}
                      >
                        {deleting ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <CollapsibleContent>
            <div className="border-t border-border bg-muted/15 px-3 py-3 text-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1 space-y-3">
                    <p
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        dueLabel ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      Due: {dueLabel ?? "No due date"}
                    </p>
                    {ordered.length <= 1 ? (
                      <p className="whitespace-pre-wrap text-foreground">
                        {descriptionText ? descriptionText : "No description."}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Assigned by
                    </p>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar size="default" aria-label={assignedBy.name}>
                            {assignedBy.imageSrc ? (
                              <AvatarImage src={assignedBy.imageSrc} alt="" />
                            ) : null}
                            <AvatarFallback>{initials(assignedBy.name)}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="left">{assignedBy.name}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {ordered.length > 1 ? (
                  <div className="space-y-3 border-t border-border/80 pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Stages
                    </p>
                    <div className="flex flex-col">
                      {ordered.map((st, i) => {
                        const stageDone = isDoneStatus(st.status);
                        const nextTarget: "done" | "to-do" = stageDone ? "to-do" : "done";
                        const blocked = stageToggleBlockedReason(
                          ordered,
                          i,
                          currentUserId,
                          nextTarget,
                        );
                        const busy = updatingStageId === st.id;
                        const label = stageLabel(st);
                        return (
                          <div key={st.id} className="flex min-h-0 gap-3">
                            <div className="flex w-10 shrink-0 flex-col items-center self-stretch pt-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    disabled={
                                      !onStageStatusUpdated || busy || blocked != null
                                    }
                                    aria-busy={busy}
                                    aria-pressed={stageDone}
                                    title={blocked ?? undefined}
                                    aria-label={label}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void toggleStageStatus(st, i);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className={cn(
                                      stageDotHitClass,
                                      "rounded-full transition-colors",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                      "disabled:pointer-events-none disabled:opacity-40",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "flex items-center justify-center",
                                        stageDotInnerClass,
                                        "transition-colors",
                                        stageDone
                                          ? "border-primary bg-primary"
                                          : "border-muted-foreground/45 bg-background hover:border-muted-foreground/65",
                                      )}
                                    >
                                      {busy ? (
                                        <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
                                      ) : null}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                {blocked ? (
                                  <TooltipContent side="right" className="max-w-xs">
                                    {blocked}
                                  </TooltipContent>
                                ) : null}
                              </Tooltip>
                              {i < ordered.length - 1 ? (
                                <div
                                  className={cn(
                                    "mt-0.5 min-h-[0.75rem] w-0.5 flex-1 rounded-full",
                                    isDoneStatus(st.status) ? "bg-primary" : "bg-border",
                                  )}
                                  aria-hidden
                                />
                              ) : null}
                            </div>
                            <div
                              className={cn(
                                "min-w-0 flex-1",
                                i < ordered.length - 1 ? "pb-4" : "",
                              )}
                            >
                              <div className="rounded-lg border border-border/80 bg-background/80 p-3 shadow-sm">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                  <p className="min-w-0 flex-1 font-medium text-foreground">
                                    {label}
                                  </p>
                                  {st.employees.length > 0 ? (
                                    <AvatarGroup className="shrink-0">
                                      {[...st.employees]
                                        .sort((a, b) => a.id - b.id)
                                        .map((emp) => {
                                          const a = employeeToAssignee(emp);
                                          return (
                                            <Tooltip key={a.id}>
                                              <TooltipTrigger asChild>
                                                <Avatar size="sm" aria-label={a.name}>
                                                  {a.imageSrc ? (
                                                    <AvatarImage src={a.imageSrc} alt="" />
                                                  ) : null}
                                                  <AvatarFallback>
                                                    {initials(a.name)}
                                                  </AvatarFallback>
                                                </Avatar>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">{a.name}</TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                    </AvatarGroup>
                                  ) : null}
                                </div>
                                <p className="mb-2 whitespace-pre-wrap text-foreground">
                                  {st.description?.trim()
                                    ? st.description
                                    : "No description."}
                                </p>
                                {st.contents.length > 0 ? (
                                  <div className="border-t border-border/60 pt-2">
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                      Linked documents
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                      {st.contents.map((doc) => (
                                        <button
                                          key={doc.id}
                                          type="button"
                                          onClick={() =>
                                            onLinkedDocumentOpen({
                                              id: doc.id,
                                              title: doc.title,
                                              filePath: doc.filePath ?? null,
                                            })
                                          }
                                          className={cn(
                                            "flex h-12 max-h-12 min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left shadow-sm transition-colors",
                                            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                          )}
                                        >
                                          <FileIcon
                                            className="size-4 shrink-0 text-muted-foreground"
                                            aria-hidden
                                          />
                                          <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight text-foreground">
                                            {doc.title}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {ordered.length === 1 && ordered[0] != null && ordered[0].contents.length > 0 ? (
                  <div className="border-t border-border/80 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Linked documents
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ordered[0].contents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() =>
                            onLinkedDocumentOpen({
                              id: doc.id,
                              title: doc.title,
                              filePath: doc.filePath ?? null,
                            })
                          }
                          className={cn(
                            "flex h-12 max-h-12 min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left shadow-sm transition-colors",
                            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          )}
                        >
                          <FileIcon
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium leading-tight text-foreground">
                            {doc.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </TooltipProvider>
  );
}
