import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/elements/buttons/button.tsx";
import { addDays, isValid, parseISO, startOfDay } from "date-fns";
import Fuse from "fuse.js";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import DocumentViewer from "@/components/DocumentViewer.tsx";
import {
  ServiceRequestCard,
  type ServiceRequestAssignee,
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
import { HelpHint } from "@/elements/help-hint.tsx";
import { Separator } from "@/elements/separator.tsx";
import type { Employee } from "db";

type EmployeePayload = {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
};

type ServiceRequestPayload = {
  id: number;
  title: string | null;
  description: string | null;
  dateDue: string | null;
  dateCreated?: string;
  priority: string | null;
  status?: string;
  owner: EmployeePayload;
  employees: EmployeePayload[];
  contents?: ServiceRequestLinkedDocument[];
};

function assigneesFromRequest(req: ServiceRequestPayload): ServiceRequestAssignee[] {
  const map = new Map<number, ServiceRequestAssignee>();
  const add = (e: EmployeePayload) => {
    map.set(e.id, {
      id: String(e.id),
      name: `${e.firstName} ${e.lastName}`.trim(),
      imageSrc: e.profileImageUrl,
    });
  };
  add(req.owner);
  for (const e of req.employees) add(e);
  return [...map.values()];
}

function assignedByFromOwner(owner: EmployeePayload) {
  return {
    name: `${owner.firstName} ${owner.lastName}`.trim(),
    imageSrc: owner.profileImageUrl,
  };
}

function isAssignedEmployee(req: ServiceRequestPayload, userId: number): boolean {
  return req.employees.some((e) => e.id === userId);
}

function displayTitle(req: ServiceRequestPayload): string {
  return (
    req.title?.trim() ||
    req.description?.trim() ||
    `Service request #${req.id}`
  );
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
  req: ServiceRequestPayload,
  f: ServiceRequestFieldsFilter,
  meId: number
): boolean {
  if (f.assignment === "mine" && !isAssignedEmployee(req, meId)) return false;
  if (f.assignment === "others" && isAssignedEmployee(req, meId)) return false;

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

function sortKeyForRequest(
  req: ServiceRequestPayload,
  sortBy: string
): string {
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
      return displayTitle(req).toLowerCase();
  }
}

function sortRequests(
  list: ServiceRequestPayload[],
  sortFields: SortFields
): ServiceRequestPayload[] {
  const cmp =
    sortFields.sortMethod === "descending"
      ? (a: string, b: string) => -a.localeCompare(b)
      : (a: string, b: string) => a.localeCompare(b);
  return [...list].sort((a, b) =>
    cmp(sortKeyForRequest(a, sortFields.sortBy), sortKeyForRequest(b, sortFields.sortBy))
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

export default function ServiceRequestsPage() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<ServiceRequestPayload[] | null>(null);
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
        return res.json() as Promise<ServiceRequestPayload[]>;
      }),
    ])
      .then(([me, data]) => {
        if (!cancelled) {
          setMeId(me.id);
          setRequests(data);
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

  const handleStatusUpdated = useCallback((id: number, status: string) => {
    setRequests((prev) =>
      prev == null ? prev : prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }, []);

  const handleDeleted = useCallback((id: number) => {
    setRequests((prev) => (prev == null ? prev : prev.filter((r) => r.id !== id)));
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
          getFn: (r) =>
            (r.contents ?? []).map((c) => c.title).join(" "),
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
      matchesServiceRequestFilter(r, fieldsFilter, meId)
    );
    return sortRequests(filtered, sortFields);
  }, [requests, meId, searchPhrase, fuse, fieldsFilter, sortFields]);

  const { yourTasks, allTasks } = useMemo(() => {
    if (meId == null) {
      return { yourTasks: [] as ServiceRequestPayload[], allTasks: [] as ServiceRequestPayload[] };
    }
    const yours: ServiceRequestPayload[] = [];
    const rest: ServiceRequestPayload[] = [];
    for (const req of queryResults) {
      if (isAssignedEmployee(req, meId)) yours.push(req);
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
        <div className="min-w-0 max-w-[21rem] flex-1">
          <SearchBar setFilter={setSearchPhrase} />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            to="/documents/service-requests/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            + New Request
          </Link>
          <FilterButton
            emptyFields={{ ...DEFAULT_SERVICE_REQUEST_FIELDS_FILTER }}
            defaultFields={{ ...DEFAULT_SERVICE_REQUEST_FIELDS_FILTER }}
            fields={fieldsFilter}
            setFields={setFieldsFilter}
            createFieldsElement={FilterServiceRequestFields}
          />
          <SortButton
            sortByMap={SERVICE_REQUEST_SORT_BY_MAP as Record<string, string>}
            defaultSortFields={DEFAULT_SORT_FIELDS}
            sortFields={sortFields}
            setSortFields={setSortFields}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-auto px-4 pb-8">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-center text-destructive">{error}</p>
        ) : requests!.length === 0 ? (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <p className="text-lg font-medium text-foreground">No service requests</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              There are no service requests yet. When requests are created, they will appear
              here.
            </p>
          </div>
        ) : queryResults.length === 0 ? (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <p className="text-lg font-medium text-foreground">No matching requests</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try adjusting search, filters, or sort.
            </p>
          </div>
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
                        id={String(req.id)}
                        title={displayTitle(req)}
                        description={req.description}
                        dateDue={req.dateDue}
                        assignedBy={assignedByFromOwner(req.owner)}
                        assignees={assigneesFromRequest(req)}
                        status={req.status ?? "to-do"}
                        linkedDocuments={req.contents ?? []}
                        onLinkedDocumentOpen={handleLinkedDocumentOpen}
                        onStatusUpdated={handleStatusUpdated}
                        onDeleted={handleDeleted}
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
                        id={String(req.id)}
                        title={displayTitle(req)}
                        description={req.description}
                        dateDue={req.dateDue}
                        assignedBy={assignedByFromOwner(req.owner)}
                        assignees={assigneesFromRequest(req)}
                        status={req.status ?? "to-do"}
                        linkedDocuments={req.contents ?? []}
                        onLinkedDocumentOpen={handleLinkedDocumentOpen}
                        onStatusUpdated={handleStatusUpdated}
                        onDeleted={handleDeleted}
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
