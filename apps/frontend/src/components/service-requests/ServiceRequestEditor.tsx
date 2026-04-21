import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Calendar } from "@/components/Calendar.tsx";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import { Label } from "@/elements/label.tsx";
import { Textarea } from "@/elements/textarea.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/elements/buttons/popover.tsx";
import { cn, formatDate } from "@/lib/utils.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/elements/select.tsx";
import {
  AssignEmployeesCombobox,
  type AssignEmployeeOption,
} from "@/components/service-requests/AssignEmployeesCombobox.tsx";
import {
  LinkContentsCombobox,
  type LinkContentOption,
} from "@/components/service-requests/LinkContentsCombobox.tsx";
import type { Employee } from "db";

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

type FormSnapshot = {
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  assigneeIds: number[];
  contentIds: number[];
};

type ServiceRequestDetail = {
  id: number;
  title: string | null;
  description: string | null;
  dateDue: string | null;
  priority: string | null;
  employees: { id: number; firstName: string; lastName: string }[];
  contents: { id: number; title: string }[];
};

const PRIORITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "yyyy-MM-dd") : "";
}

function dueStringToDate(yyyyMmDd: string): Date | undefined {
  if (!yyyyMmDd.trim()) return undefined;
  const d = parseISO(`${yyyyMmDd.trim()}T12:00:00`);
  return isValid(d) ? d : undefined;
}

function dateInputToIsoForApi(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  return `${t}T12:00:00.000Z`;
}

function priorityFromApi(p: string | null | undefined): string {
  if (!p?.trim()) return "none";
  const v = p.trim().toLowerCase();
  return PRIORITY_OPTIONS.some((o) => o.value === v) ? v : "none";
}

function priorityToApi(internal: string): string | null {
  if (!internal || internal === "none") return null;
  return internal;
}

function mergeContentOptions(
  fromApi: LinkContentOption[],
  fromRequest: { id: number; title: string }[]
): LinkContentOption[] {
  const map = new Map<number, string>();
  for (const c of fromApi) map.set(c.id, c.title);
  for (const c of fromRequest) {
    if (!map.has(c.id)) map.set(c.id, c.title);
  }
  return [...map.entries()]
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.id - b.id);
}

export type ServiceRequestEditorProps = {
  mode: "create" | "edit";
  /** Numeric id when `mode` is `"edit"` */
  requestId?: string;
};

function isValidYyyyMmDd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return false;
  const d = parseISO(`${s.trim()}T12:00:00`);
  return isValid(d);
}

export function ServiceRequestEditor({ mode, requestId }: ServiceRequestEditorProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const titleRef = React.useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [priority, setPriority] = React.useState("none");
  const [assigneeIds, setAssigneeIds] = React.useState<number[]>([]);
  const [contentIds, setContentIds] = React.useState<number[]>([]);

  const [employees, setEmployees] = React.useState<AssignEmployeeOption[]>([]);
  const [contents, setContents] = React.useState<LinkContentOption[]>([]);
  const [ownerId, setOwnerId] = React.useState<number | null>(null);

  const [baseline, setBaseline] = React.useState<FormSnapshot | null>(null);
  const [editRequestNumericId, setEditRequestNumericId] = React.useState<number | null>(null);

  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [dueDateOpen, setDueDateOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const isEdit = mode === "edit";
    const idNum = requestId != null ? Number(requestId) : NaN;

    if (isEdit && (requestId == null || Number.isNaN(idNum))) {
      setLoadError("Invalid request.");
      return;
    }

    const detailPromise = isEdit
      ? fetch(`${base}/servicereqs/detail/${idNum}`, { credentials: "include" }).then(
          (r) => {
            if (r.status === 404) throw new Error("Request not found.");
            if (!r.ok) throw new Error("Could not load this request.");
            return r.json() as Promise<ServiceRequestDetail>;
          }
        )
      : Promise.resolve(null);

    Promise.all([
      fetch(`${base}/me`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Could not load your account.");
        return r.json() as Promise<Employee>;
      }),
      fetch(`${base}/employee`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Could not load employees.");
        return r.json() as Promise<Employee[]>;
      }),
      fetch(`${base}/content`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Could not load documents.");
        return r.json() as Promise<{ id: number; title: string }[]>;
      }),
      detailPromise,
    ])
      .then(([me, emps, docs, detail]) => {
        if (cancelled) return;
        setOwnerId(me.id);
        setEmployees(
          emps.map((e) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            jobPosition: e.jobPosition,
          }))
        );

        const docOpts = docs.map((c) => ({ id: c.id, title: c.title }));
        if (detail) {
          setEditRequestNumericId(detail.id);
          const nextTitle = detail.title ?? "";
          const nextDescription = detail.description ?? "";
          const nextDue = isoToDateInput(detail.dateDue);
          const nextPriority = priorityFromApi(detail.priority);
          const nextAssignees = detail.employees.map((e) => e.id);
          const nextContents = detail.contents.map((c) => c.id);
          setContents(mergeContentOptions(docOpts, detail.contents));
          setTitle(nextTitle);
          setDescription(nextDescription);
          setDueDate(nextDue);
          setPriority(nextPriority);
          setAssigneeIds(nextAssignees);
          setContentIds(nextContents);
          setBaseline({
            title: nextTitle,
            description: nextDescription,
            dueDate: nextDue,
            priority: nextPriority,
            assigneeIds: [...nextAssignees],
            contentIds: [...nextContents],
          });
        } else {
          setContents(docOpts);
          setAssigneeIds((prev) =>
            prev.includes(me.id) ? prev : [...prev, me.id]
          );
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load page.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, requestId]);

  const dueFromUrl = searchParams.get("due");
  React.useEffect(() => {
    if (mode !== "create") return;
    if (!dueFromUrl?.trim() || !isValidYyyyMmDd(dueFromUrl)) return;
    setDueDate(dueFromUrl.trim());
  }, [mode, dueFromUrl]);

  const resizeTitle = React.useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, []);

  React.useLayoutEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  const disabled =
    loadError != null || (mode === "create" ? ownerId == null : editRequestNumericId == null);

  function handleReset() {
    if (!baseline) return;
    setTitle(baseline.title);
    setDescription(baseline.description);
    setDueDate(baseline.dueDate);
    setPriority(baseline.priority);
    setAssigneeIds([...baseline.assigneeIds]);
    setContentIds([...baseline.contentIds]);
    setSubmitError(null);
  }

  function handleCancel() {
    navigate("/documents/service-requests");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (mode === "create") {
      if (ownerId == null) return;
      setSubmitting(true);
      try {
        const dueIso = dateInputToIsoForApi(dueDate);
        const employeeIdsMerged = Array.from(
          new Set([...assigneeIds, ownerId])
        );
        const res = await fetch(`${base}/servicereqs`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId,
            title: title.trim() || undefined,
            description: description.trim() || undefined,
            ...(dueIso ? { dateDue: dueIso } : {}),
            ...(priority && priority !== "none" ? { priority } : {}),
            employeeIds: employeeIdsMerged,
            contentIds: contentIds.length ? contentIds : undefined,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(
            typeof errBody.error === "string" ? errBody.error : "Could not create request."
          );
        }
        await res.json();
        navigate("/documents/service-requests");
      } catch (err: unknown) {
        setSubmitError(err instanceof Error ? err.message : "Could not create request.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (editRequestNumericId == null) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/servicereqs/${editRequestNumericId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dateDue: dateInputToIsoForApi(dueDate),
          priority: priorityToApi(priority),
          employeeIds: assigneeIds,
          contentIds: contentIds,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          typeof errBody.error === "string" ? errBody.error : "Could not update request."
        );
      }
      await res.json();
      navigate("/documents/service-requests");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Could not update request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="gap-1.5"
        >
          <ArrowLeftIcon />
          Back
        </Button>
      </header>

      {loadError ? (
        <p className="px-4 py-8 text-center text-destructive">{loadError}</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0 flex-1">
              <label htmlFor="sr-title" className="sr-only">
                Request name
              </label>
              <textarea
                id="sr-title"
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={1}
                placeholder="Untitled request"
                disabled={disabled}
                className="w-full resize-none border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0 md:text-4xl"
              />
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs sm:pt-1">
              <Label htmlFor="sr-assignees">Assign to</Label>
              <AssignEmployeesCombobox
                employees={employees}
                value={assigneeIds}
                onValueChange={setAssigneeIds}
                disabled={disabled}
                placeholder="Select employees…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sr-description">Description</Label>
            <Textarea
              id="sr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this request…"
              disabled={disabled}
              className="min-h-28"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sr-due">Due date</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="sr-due"
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      className={cn(
                        "h-9 w-full max-w-xs justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
                      {dueDate ? (
                        formatDate(dueStringToDate(dueDate))
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueStringToDate(dueDate)}
                      defaultMonth={dueStringToDate(dueDate) ?? new Date()}
                      onSelect={(d) => {
                        setDueDate(d ? format(d, "yyyy-MM-dd") : "");
                        setDueDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {dueDate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-muted-foreground"
                    disabled={disabled}
                    onClick={() => setDueDate("")}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sr-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={setPriority}
                disabled={disabled}
              >
                <SelectTrigger id="sr-priority" className="w-full max-w-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sr-docs">Linked documents</Label>
            <LinkContentsCombobox
              contents={contents}
              value={contentIds}
              onValueChange={setContentIds}
              disabled={disabled}
            />
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            {mode === "edit" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleReset}
                    disabled={disabled || submitting || baseline == null}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={disabled || submitting}
                    className="bg-hanover-blue text-white hover:bg-hanover-blue/90"
                  >
                    {submitting ? "Updating…" : "Update"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="ml-auto flex justify-end">
                <Button
                  type="submit"
                  disabled={disabled || submitting}
                  className="bg-hanover-blue text-white hover:bg-hanover-blue/90"
                >
                  {submitting ? "Creating…" : "Create request"}
                </Button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
