import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import type { WorkflowPayload } from "@/components/service-requests/workflowTypes.ts";
import { sortedStages } from "@/components/service-requests/workflowTypes.ts";
import {
  WORKFLOW_CREATION_PRESETS,
  WORKFLOW_CREATION_TEMPLATE_AGENT_PIPELINE,
  getWorkflowCreationPreset,
  type WorkflowCreationPreset,
  type WorkflowCreationPresetKey,
} from "@/components/service-requests/workflowCreationPresets.ts";
import type { Employee } from "db";
import { useAppPathPrefix } from "@/hooks/useAppPathPrefix.ts";

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

export type StageDraft = {
  /** Stable React key; new stages only have key until saved */
  key: string;
  stageId?: number;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  assigneeIds: number[];
  contentIds: number[];
};

type EditBaseline = {
  workflowTitle: string;
  stages: StageDraft[];
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
  fromRequest: { id: number; title: string }[],
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

function newStageDraft(key?: string): StageDraft {
  return {
    key: key ?? crypto.randomUUID(),
    title: "",
    description: "",
    dueDate: "",
    priority: "none",
    assigneeIds: [],
    contentIds: [],
  };
}

function draftStagesFromPreset(preset: WorkflowCreationPreset): StageDraft[] {
  return preset.stages.map((seed) => ({
    ...newStageDraft(),
    title: seed.title,
    description: seed.description,
  }));
}

export type ServiceRequestEditorProps = {
  mode: "create" | "edit";
  /** Workflow id when `mode` is `"edit"` */
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
  const pathPrefix = useAppPathPrefix();

  const [workflowTitle, setWorkflowTitle] = React.useState("");
  const [stages, setStages] = React.useState<StageDraft[]>(() => [newStageDraft()]);

  const [employees, setEmployees] = React.useState<AssignEmployeeOption[]>([]);
  const [contents, setContents] = React.useState<LinkContentOption[]>([]);
  const [ownerId, setOwnerId] = React.useState<number | null>(null);

  const [baseline, setBaseline] = React.useState<EditBaseline | null>(null);
  const [editWorkflowId, setEditWorkflowId] = React.useState<number | null>(null);

  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [duePopoverKey, setDuePopoverKey] = React.useState<string | null>(null);
  const [creationTemplateKey, setCreationTemplateKey] = React.useState<
    "" | WorkflowCreationPresetKey
  >("");

  const updateStage = React.useCallback((key: string, patch: Partial<StageDraft>) => {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }, []);

  const creationTemplateFromUrl = searchParams.get("template") ?? "";

  React.useEffect(() => {
    let cancelled = false;
    const isEdit = mode === "edit";
    const idNum = requestId != null ? Number(requestId) : NaN;

    if (isEdit && (requestId == null || Number.isNaN(idNum))) {
      setLoadError("Invalid request.");
      return;
    }

    const detailPromise = isEdit
      ? fetch(`${base}/servicereqs/detail/${idNum}`, { credentials: "include" }).then((r) => {
          if (r.status === 404) throw new Error("Request not found.");
          if (!r.ok) throw new Error("Could not load this request.");
          return r.json() as Promise<WorkflowPayload>;
        })
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
          })),
        );

        const docOpts = docs.map((c) => ({ id: c.id, title: c.title }));

        if (detail) {
          setEditWorkflowId(detail.id);
          const ordered = sortedStages(detail.stages);
          const allReqContents = ordered.flatMap((s) => s.contents);
          setContents(mergeContentOptions(docOpts, allReqContents));

          const loadedStages: StageDraft[] = ordered.map((st) => ({
            key: `stage-${st.id}`,
            stageId: st.id,
            title: st.title ?? "",
            description: st.description ?? "",
            dueDate: isoToDateInput(st.dateDue),
            priority: priorityFromApi(st.priority),
            assigneeIds: st.employees.map((e) => e.id),
            contentIds: st.contents.map((c) => c.id),
          }));

          const wt = detail.title?.trim() ?? "";
          setWorkflowTitle(wt);
          setStages(loadedStages.length ? loadedStages : [newStageDraft()]);
          setBaseline({
            workflowTitle: wt,
            stages: loadedStages.map((s) => ({ ...s })),
          });
        } else {
          setContents(docOpts);
          const preset = getWorkflowCreationPreset(creationTemplateFromUrl);
          if (preset) {
            setStages(draftStagesFromPreset(preset));
            setWorkflowTitle(preset.defaultWorkflowTitle ?? "");
            setCreationTemplateKey(preset.key);
          } else {
            setStages([newStageDraft()]);
            setWorkflowTitle("");
            setCreationTemplateKey("");
          }
          setBaseline(null);
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
  }, [mode, requestId, creationTemplateFromUrl]);

  const dueFromUrl = searchParams.get("due");
  React.useEffect(() => {
    if (mode !== "create") return;
    if (!dueFromUrl?.trim() || !isValidYyyyMmDd(dueFromUrl)) return;
    setStages((prev) => {
      if (prev.length === 0) return [newStageDraft()];
      const first = prev[0]!;
      return [{ ...first, dueDate: dueFromUrl.trim() }, ...prev.slice(1)];
    });
  }, [mode, dueFromUrl]);

  const resizeTitle = React.useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, []);

  React.useLayoutEffect(() => {
    resizeTitle();
  }, [workflowTitle, resizeTitle]);

  const disabled =
    loadError != null || (mode === "create" ? ownerId == null : editWorkflowId == null);

  function handleReset() {
    if (!baseline) return;
    setWorkflowTitle(baseline.workflowTitle);
    setStages(baseline.stages.map((s) => ({ ...s, key: s.key })));
    setSubmitError(null);
  }

  function handleCancel() {
    navigate(`${pathPrefix}/service-requests`);
  }

  function addStage() {
    setStages((prev) => [...prev, newStageDraft()]);
  }

  function removeStage(key: string) {
    setStages((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.key !== key)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (ownerId == null) return;

    if (mode === "create") {
      setSubmitting(true);
      try {
        const payloadStages = stages.map((s) => {
          const dueIso = dateInputToIsoForApi(s.dueDate);
          const pri = priorityToApi(s.priority);
          return {
            title: s.title.trim() || undefined,
            description: s.description.trim() || undefined,
            ...(dueIso ? { dateDue: dueIso } : {}),
            ...(pri ? { priority: pri } : {}),
            employeeIds: Array.from(new Set(s.assigneeIds)),
            contentIds: s.contentIds.length ? s.contentIds : undefined,
          };
        });

        const res = await fetch(`${base}/servicereqs`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId,
            title: workflowTitle.trim() || undefined,
            stages: payloadStages,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(
            typeof errBody.error === "string" ? errBody.error : "Could not create request.",
          );
        }
        await res.json();
        navigate(`${pathPrefix}/service-requests`);
      } catch (err: unknown) {
        setSubmitError(err instanceof Error ? err.message : "Could not create request.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (editWorkflowId == null) return;
    setSubmitting(true);
    try {
      if (baseline && workflowTitle.trim() !== baseline.workflowTitle.trim()) {
        const wfRes = await fetch(`${base}/servicereqs/workflow/${editWorkflowId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: workflowTitle.trim() }),
        });
        if (!wfRes.ok) {
          const errBody = await wfRes.json().catch(() => ({}));
          throw new Error(
            typeof errBody.error === "string" ? errBody.error : "Could not update workflow.",
          );
        }
      }

      for (const s of stages) {
        if (s.stageId == null) continue;
        const res = await fetch(`${base}/servicereqs/stage/${s.stageId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: s.title.trim(),
            description: s.description.trim(),
            dateDue: dateInputToIsoForApi(s.dueDate),
            priority: priorityToApi(s.priority),
            employeeIds: Array.from(new Set(s.assigneeIds)),
            contentIds: s.contentIds,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(
            typeof errBody.error === "string" ? errBody.error : "Could not update a stage.",
          );
        }
      }

      navigate(`${pathPrefix}/service-requests`);
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8"
          >
          <div className="min-w-0 flex-1">
            <label htmlFor="sr-workflow-title" className="sr-only">
              Workflow title
            </label>
            <textarea
              id="sr-workflow-title"
              ref={titleRef}
              value={workflowTitle}
              onChange={(e) => setWorkflowTitle(e.target.value)}
              rows={1}
              placeholder="Untitled workflow"
              disabled={disabled}
              className="w-full resize-none border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0 md:text-4xl"
            />
          </div>

          {mode === "create" ? (
            <div className="flex max-w-md flex-col gap-2">
              <Label htmlFor="sr-creation-template">Template</Label>
              <Select
                value={creationTemplateKey === "" ? "blank" : creationTemplateKey}
                onValueChange={(v) => {
                  if (v === "blank") {
                    setCreationTemplateKey("");
                    setStages([newStageDraft()]);
                    return;
                  }
                  const key = v as WorkflowCreationPresetKey;
                  const preset = WORKFLOW_CREATION_PRESETS[key];
                  if (!preset) return;
                  setCreationTemplateKey(key);
                  setStages(draftStagesFromPreset(preset));
                  setWorkflowTitle(preset.defaultWorkflowTitle ?? "");
                }}
                disabled={disabled}
              >
                <SelectTrigger id="sr-creation-template">
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank (single stage)</SelectItem>
                  <SelectItem value={WORKFLOW_CREATION_TEMPLATE_AGENT_PIPELINE}>
                    {WORKFLOW_CREATION_PRESETS.agentUnderwriterApprover.label}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-10">
            {stages.map((stage) => (
              <section
                key={stage.key}
                className="flex flex-col gap-6 rounded-xl border border-border bg-muted/20 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`sr-stage-title-${stage.key}`} className="sr-only">
                      Stage title
                    </Label>
                    <Textarea
                      id={`sr-stage-title-${stage.key}`}
                      value={stage.title}
                      onChange={(e) => updateStage(stage.key, { title: e.target.value })}
                      placeholder="Untitled stage"
                      disabled={disabled}
                      rows={2}
                      className="min-h-[52px] w-full resize-y border-0 bg-transparent p-0 text-lg font-semibold text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:max-w-sm">
                    <Label htmlFor={`sr-assignees-${stage.key}`}>Assign to</Label>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <AssignEmployeesCombobox
                          employees={employees}
                          value={stage.assigneeIds}
                          onValueChange={(ids) => updateStage(stage.key, { assigneeIds: ids })}
                          disabled={disabled}
                          placeholder="Select employees…"
                        />
                      </div>
                      {mode === "create" && stages.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Remove this stage"
                          onClick={() => removeStage(stage.key)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`sr-desc-${stage.key}`}>Description</Label>
                  <Textarea
                    id={`sr-desc-${stage.key}`}
                    value={stage.description}
                    onChange={(e) => updateStage(stage.key, { description: e.target.value })}
                    placeholder="Add details for this stage…"
                    disabled={disabled}
                    className="min-h-28"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`sr-due-${stage.key}`}>Due date</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Popover
                        open={duePopoverKey === stage.key}
                        onOpenChange={(o) => setDuePopoverKey(o ? stage.key : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            id={`sr-due-${stage.key}`}
                            type="button"
                            variant="outline"
                            disabled={disabled}
                            className={cn(
                              "h-9 w-full max-w-xs justify-start text-left font-normal",
                              !stage.dueDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
                            {stage.dueDate ? (
                              formatDate(dueStringToDate(stage.dueDate))
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dueStringToDate(stage.dueDate)}
                            defaultMonth={dueStringToDate(stage.dueDate) ?? new Date()}
                            onSelect={(d) => {
                              updateStage(stage.key, {
                                dueDate: d ? format(d, "yyyy-MM-dd") : "",
                              });
                              setDuePopoverKey(null);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {stage.dueDate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 text-muted-foreground"
                          disabled={disabled}
                          onClick={() => updateStage(stage.key, { dueDate: "" })}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`sr-priority-${stage.key}`}>Priority</Label>
                    <Select
                      value={stage.priority}
                      onValueChange={(v) => updateStage(stage.key, { priority: v })}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`sr-priority-${stage.key}`} className="w-full max-w-xs">
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
                  <Label htmlFor={`sr-docs-${stage.key}`}>Linked documents</Label>
                  <LinkContentsCombobox
                    contents={contents}
                    value={stage.contentIds}
                    onValueChange={(ids) => updateStage(stage.key, { contentIds: ids })}
                    disabled={disabled}
                  />
                </div>
              </section>
            ))}
          </div>

          {mode === "create" ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed"
              disabled={disabled}
              onClick={addStage}
            >
              <PlusIcon className="size-4" />
              Add stage
            </Button>
          ) : null}

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
        </div>
      )}
    </div>
  );
}
