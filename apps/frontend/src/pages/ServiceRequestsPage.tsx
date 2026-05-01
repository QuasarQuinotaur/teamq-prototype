import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppPathPrefix } from "@/hooks/useAppPathPrefix.ts";
import { useServiceRequestTutorial } from "@/components/tutorial/ServiceRequestTutorialContext.tsx";
import { ChevronDown } from "lucide-react";
import { addDays, isValid, parseISO, startOfDay } from "date-fns";
import Fuse from "fuse.js";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import DocumentViewer from "@/components/DocumentViewer.tsx";
import { EmptyResultsState } from "@/components/EmptyResultsState.tsx";
import {
  ServiceRequestCard,
  type ServiceRequestLinkedDocument,
} from "@/components/service-requests/ServiceRequests.tsx";
import SearchBar from "@/components/paging/toolbar/SearchBar.tsx";
import FilterButton from "@/components/paging/toolbar/FilterButton.tsx";
import SortButton from "@/components/paging/toolbar/SortButton.tsx";
import type { SortFields } from "@/components/forms/SortForm.tsx";
import { DEFAULT_SORT_FIELDS } from "@/components/paging/hooks/sort-function.tsx";
import { SERVICE_REQUEST_SORT_BY_MAP } from "@/components/input/constants.tsx";
import FilterServiceRequestFields, {
  DEFAULT_SERVICE_REQUEST_FIELDS_FILTER,
  type ServiceRequestFieldsFilter,
  type ServiceRequestPresetKey,
} from "@/components/service-requests/FilterServiceRequestFields.tsx";
import {
  type WorkflowPayload,
  type WorkflowListRow,
  allEmployeeIdsFromWorkflow,
  displayWorkflowTitle,
  enrichWorkflowForList,
  mergeStageStatus,
} from "@/components/service-requests/workflowTypes.ts";
import {
  WORKFLOW_CREATION_PRESETS,
  WORKFLOW_CREATION_PRESET_ORDER,
} from "@/components/service-requests/workflowCreationPresets.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";
import { Separator } from "@/elements/separator.tsx";
import type { Employee } from "db";

function isAssignedToWorkflow(row: WorkflowListRow, userId: number): boolean {
  return allEmployeeIdsFromWorkflow(row.stages).has(userId);
}

function isDoneStatus(status: string | undefined): boolean {
  return (status ?? "").trim() === "done";
}

function parseDueDay(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = parseISO(iso);
  if (!isValid(d)) return null;
  return startOfDay(d);
}

function presetFromSearchParams(sp: URLSearchParams): ServiceRequestPresetKey {
  const raw = sp.get("preset");
  if (raw === "overdue" || raw === "week" || raw === "todo" || raw === "done") {
    return raw;
  }
  return "all";
}

function matchesServiceRequestFilter(
  req: WorkflowListRow,
  f: ServiceRequestFieldsFilter,
  meId: number,
): boolean {
  if (f.assignment === "mine" && !isAssignedToWorkflow(req, meId)) return false;
  if (f.assignment === "others" && isAssignedToWorkflow(req, meId)) return false;

  if (f.preset !== "all") {
    const today = startOfDay(new Date());
    const weekEnd = startOfDay(addDays(today, 6));
    const due = parseDueDay(req.dateDue);
    const done = isDoneStatus(req.status);

    if (f.preset === "done") {
      if (!done) return false;
    } else {
      if (done) return false;
      if (f.preset === "overdue") {
        if (!due || due >= today) return false;
      } else if (f.preset === "week") {
        if (!due || due < today || due > weekEnd) return false;
      } else if (f.preset === "todo") {
        if (due && due < today) return false;
        if (due && due >= today && due <= weekEnd) return false;
      }
    }
  }

  if (f.statuses.length > 0) {
    const rs = (req.status ?? "").toLowerCase().trim();
    const ok = f.statuses.some((k) => k.toLowerCase() === rs);
    if (!ok) return false;
  }

  if (f.priorities.length > 0) {
    const p = (req.priority?.trim() || "none").toLowerCase();
    const ok = f.priorities.some((k) => k.toLowerCase() === p);
    if (!ok) return false;
  }

  return true;
}

const PRIORITY_SORT_ORDER = ["none", "low", "normal", "high", "urgent"] as const;

function prioritySortKey(p: string | null | undefined): string {
  const v = (p?.trim() || "none").toLowerCase();
  const i = PRIORITY_SORT_ORDER.indexOf(v as (typeof PRIORITY_SORT_ORDER)[number]);
  return String(i >= 0 ? i : 99).padStart(2, "0");
}

function sortKeyForRequest(req: WorkflowListRow, sortBy: string): string {
  switch (sortBy) {
    case "id":
      return String(req.id).padStart(12, "0");
    case "dateDue": {
      const t = req.dateDue ? new Date(req.dateDue).getTime() : null;
      return t != null && !Number.isNaN(t) ? String(t).padStart(15, "0") : "";
    }
    case "priority":
      return prioritySortKey(req.priority);
    case "status":
      return (req.status ?? "").toLowerCase();
    case "owner":
      return `${req.owner.firstName} ${req.owner.lastName}`.toLowerCase();
    case "title":
    default:
      return displayWorkflowTitle(req).toLowerCase();
  }
}

function sortRequests(list: WorkflowListRow[], sortFields: SortFields): WorkflowListRow[] {
  const cmp =
    sortFields.sortMethod === "descending"
      ? (a: string, b: string) => -a.localeCompare(b)
      : (a: string, b: string) => a.localeCompare(b);
  return [...list].sort((a, b) =>
    cmp(sortKeyForRequest(a, sortFields.sortBy), sortKeyForRequest(b, sortFields.sortBy)),
  );
}

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

type ViewerState = {
  contentId: number;
  url: string;
  filename: string;
  title: string;
};

function filenameForLinkedDoc(d: ServiceRequestLinkedDocument): string {
  return d.filePath?.split("/").pop()?.split("?")[0] ?? d.title;
}

function isServiceRequestsListPath(pathname: string): boolean {
  return /\/service-requests\/?$/.test(pathname);
}

export default function ServiceRequestsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const pathPrefix = useAppPathPrefix();
  const srTutorial = useServiceRequestTutorial();
  const [requests, setRequests] = useState<WorkflowListRow[] | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenDoc, setFullscreenDoc] = useState<ViewerState | null>(null);
  const [searchPhrase, setSearchPhrase] = useState("");
  const [fieldsFilter, setFieldsFilter] = useState<ServiceRequestFieldsFilter>(() => ({
    ...DEFAULT_SERVICE_REQUEST_FIELDS_FILTER,
    preset: presetFromSearchParams(searchParams),
  }));
  const [sortFields, setSortFields] = useState<SortFields>(DEFAULT_SORT_FIELDS);

  useEffect(() => {
    const next = presetFromSearchParams(searchParams);
    setFieldsFilter((f) => (f.preset === next ? f : { ...f, preset: next }));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${base}/me`, { credentials: "include" }).then((res) => {
        if (!res.ok) throw new Error("Failed to load your account");
        return res.json() as Promise<Employee>;
      }),
      fetch(`${base}/servicereqs/assigned/0`, { credentials: "include" }).then((res) => {
        if (!res.ok) throw new Error("Failed to load service requests");
        return res.json() as Promise<WorkflowPayload[]>;
      }),
    ])
      .then(([me, data]) => {
        if (!cancelled) {
          setMeId(me.id);
          const rows = Array.isArray(data) ? data.map(enrichWorkflowForList) : [];
          setRequests(rows);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setRequests([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!srTutorial?.routeIsSrTutorial) return;
    if (!isServiceRequestsListPath(location.pathname)) return;
    if (srTutorial.phase === "sidebar_sr_nav") {
      srTutorial.notifySrListRouteEntered();
    }
  }, [srTutorial, location.pathname]);

  const handleStageStatusUpdated = useCallback(
    (workflowId: number, stageId: number, status: string) => {
      setRequests((prev) =>
        prev == null
          ? prev
          : prev.map((r) => mergeStageStatus(r, workflowId, stageId, status)),
      );
    },
    [],
  );

  const handleDeleted = useCallback((workflowId: number) => {
    setRequests((prev) => (prev == null ? prev : prev.filter((r) => r.id !== workflowId)));
  }, []);

  const loadViewerFromLinkedDoc = useCallback(
    async (doc: ServiceRequestLinkedDocument): Promise<ViewerState | null> => {
      const res = await fetch(`${base}/content/${doc.id}/download`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      const body: unknown = await res.json();
      const url =
        typeof body === "object" &&
        body !== null &&
        "url" in body &&
        typeof (body as { url: unknown }).url === "string"
          ? (body as { url: string }).url
          : null;
      if (!url) return null;
      const filename = filenameForLinkedDoc(doc);
      return { contentId: doc.id, url, filename, title: doc.title };
    },
    [],
  );

  const handleLinkedDocumentOpen = useCallback(
    async (doc: ServiceRequestLinkedDocument) => {
      const state = await loadViewerFromLinkedDoc(doc);
      if (state) setFullscreenDoc(state);
    },
    [loadViewerFromLinkedDoc],
  );

  const closeFullscreen = useCallback(() => {
    setFullscreenDoc(null);
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(requests ?? [], {
      keys: [
        { name: "title", getFn: (r) => r.title ?? "" },
        { name: "description", getFn: (r) => r.description ?? "" },
        {
          name: "owner",
          getFn: (r) => `${r.owner.firstName} ${r.owner.lastName}`,
        },
        {
          name: "employees",
          getFn: (r) =>
            r.employees.map((e) => `${e.firstName} ${e.lastName}`).join(" "),
        },
        {
          name: "contents",
          getFn: (r) => r.contents.map((c) => c.title).join(" "),
        },
        { name: "id", getFn: (r) => String(r.id) },
        { name: "status", getFn: (r) => r.status?.trim() ?? "" },
        { name: "priority", getFn: (r) => r.priority ?? "" },
      ],
      threshold: 0.33,
      useExtendedSearch: true,
    });
  }, [requests]);

  const queryResults = useMemo(() => {
    if (requests == null || meId == null) return [];
    const searched =
      searchPhrase.trim() === ""
        ? requests
        : fuse.search(searchPhrase).map((x) => x.item);
    const filtered = searched.filter((r) =>
      matchesServiceRequestFilter(r, fieldsFilter, meId),
    );
    return sortRequests(filtered, sortFields);
  }, [requests, meId, searchPhrase, fuse, fieldsFilter, sortFields]);

  const { yourTasks, allTasks } = useMemo(() => {
    if (meId == null) {
      return { yourTasks: [] as WorkflowListRow[], allTasks: [] as WorkflowListRow[] };
    }
    const yours: WorkflowListRow[] = [];
    const rest: WorkflowListRow[] = [];
    for (const req of queryResults) {
      if (isAssignedToWorkflow(req, meId)) yours.push(req);
      else rest.push(req);
    }
    return { yourTasks: yours, allTasks: rest };
  }, [queryResults, meId]);

  const loading = requests === null && error === null;

  if (fullscreenDoc) {
    return (
      <DocumentViewer
        contentId={fullscreenDoc.contentId}
        url={fullscreenDoc.url}
        filename={fullscreenDoc.filename}
        title={fullscreenDoc.title}
        onClose={closeFullscreen}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 px-4 pt-5 pb-5">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <div id="tutorial-sr-search" className="min-w-0 max-w-[21rem] flex-1">
          <SearchBar setFilter={setSearchPhrase} />
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div
            id="tutorial-sr-presets"
            className="flex shrink-0 rounded-lg shadow-sm"
          >
            <Link
              id="tutorial-sr-new-request"
              to={`${pathPrefix}/service-requests/new`}
              className="inline-flex h-9 items-center justify-center rounded-l-lg border border-transparent bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              + New Request
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  className="h-9 rounded-l-none rounded-r-lg border-0 px-2 shadow-sm bg-primary hover:bg-hanover-blue/90 focus-visible:z-10"
                  aria-label="New request from a preset template"
                >
                  <ChevronDown className="size-4 opacity-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[16rem]">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Presets
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WORKFLOW_CREATION_PRESET_ORDER.map((key) => {
                  const preset = WORKFLOW_CREATION_PRESETS[key];
                  return (
                    <DropdownMenuItem key={key} asChild>
                      <Link
                        to={`${pathPrefix}/service-requests/new?template=${encodeURIComponent(key)}`}
                        className="cursor-pointer"
                      >
                        {preset.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div id="tutorial-sr-filter">
            <FilterButton
              emptyFields={{ ...DEFAULT_SERVICE_REQUEST_FIELDS_FILTER }}
              defaultFields={{ ...DEFAULT_SERVICE_REQUEST_FIELDS_FILTER }}
              fields={fieldsFilter}
              setFields={setFieldsFilter}
              createFieldsElement={FilterServiceRequestFields}
            />
          </div>
          <div id="tutorial-sr-sort">
            <SortButton
              sortByMap={SERVICE_REQUEST_SORT_BY_MAP as Record<string, string>}
              defaultSortFields={DEFAULT_SORT_FIELDS}
              sortFields={sortFields}
              setSortFields={setSortFields}
            />
          </div>
        </div>
      </header>

      <div
        id="tutorial-sr-list-overview"
        className="flex flex-1 flex-col gap-3 overflow-auto px-4 pb-8"
      >
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-center text-destructive">{error}</p>
        ) : requests!.length === 0 ? (
          <EmptyResultsState
            className="mx-auto w-full max-w-2xl flex-1 px-6"
            title="No service requests"
            description="There are no service requests yet. When requests are created, they will appear here."
          />
        ) : queryResults.length === 0 ? (
          <EmptyResultsState
            className="mx-auto w-full max-w-2xl flex-1 px-6"
            title="No matching requests"
            description="Try adjusting search, filters, or sort."
          />
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pt-2">
            {yourTasks.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <h2 className="border-b-0 pb-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Your tasks
                    </h2>
                    <HelpHint>
                      Requests where you are listed as an assignee. Updates here follow your
                      current search, filters, and sort.
                    </HelpHint>
                  </div>
                  <Separator />
                </div>
                <ul className="flex flex-col gap-2">
                  {yourTasks.map((req) => (
                    <li key={req.id}>
                      <ServiceRequestCard
                        workflow={req}
                        currentUserId={meId!}
                        title={displayWorkflowTitle(req)}
                        summaryDescription={req.description}
                        summaryDue={req.dateDue}
                        onLinkedDocumentOpen={handleLinkedDocumentOpen}
                        onStageStatusUpdated={handleStageStatusUpdated}
                        onDeleted={handleDeleted}
                        appPathPrefix={pathPrefix}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {allTasks.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5">
                  <h2 className="border-b-0 pb-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Other tasks
                  </h2>
                  <HelpHint>
                    Requests where you are not listed as an assignee. This list follows your
                    current search, filters, and sort.
                  </HelpHint>
                </div>
                <ul className="flex flex-col gap-2">
                  {allTasks.map((req) => (
                    <li key={req.id}>
                      <ServiceRequestCard
                        workflow={req}
                        currentUserId={meId!}
                        title={displayWorkflowTitle(req)}
                        summaryDescription={req.description}
                        summaryDue={req.dateDue}
                        onLinkedDocumentOpen={handleLinkedDocumentOpen}
                        onStageStatusUpdated={handleStageStatusUpdated}
                        onDeleted={handleDeleted}
                        appPathPrefix={pathPrefix}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
