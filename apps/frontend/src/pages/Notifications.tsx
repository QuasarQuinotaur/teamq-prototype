import { useNotificationTutorial } from "@/components/tutorial/NotificationTutorialContext.tsx";
import { useAppPathPrefix } from "@/hooks/useAppPathPrefix.ts";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/elements/buttons/button.tsx";
import { Megaphone } from "lucide-react";
import SelectMarqueeLayer from "@/components/paging/SelectMarqueeLayer.tsx";
import {
  MoreHorizontal,
  MailOpen,
  Trash2,
  Mail,
  ArrowUpDown,
  X,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/DropdownMenu.tsx";
import { cn } from "@/lib/utils.ts";
import { EmptyResultsState } from "@/components/EmptyResultsState.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";

type NotificationItem = {
  id: number;
  type: string;
  customMsg?: string | null;
  dateSent: string;
  dateRead?: string | null;
};

type StatusFilter = "all" | "unread" | "read";
type SortKey = "newest" | "oldest" | "type-asc" | "type-desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "type-asc": "Type A → Z",
  "type-desc": "Type Z → A",
};

const PREVIEW_MAX = 72;

function truncatePreview(text: string | null | undefined): string {
  const raw = text?.trim() || "No additional message provided.";
  return raw.length > PREVIEW_MAX ? raw.slice(0, PREVIEW_MAX).trimEnd() + "…" : raw;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// NotificationRow — Gmail-style flat row
// ---------------------------------------------------------------------------

function NotificationRow({
  notification,
  selectMode,
  selected,
  onToggleSelect,
  onMarkUnread,
  onMarkRead,
  onDelete,
  bulkActionLoading,
  pathPrefix,
}: {
  notification: NotificationItem;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onMarkUnread: (id: number) => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  bulkActionLoading: boolean;
  pathPrefix: "/documents" | "/tutorial";
}) {
  const isRead = notification.dateRead != null;
  const navigate = useNavigate();

  const handleRowClick = (e: React.MouseEvent) => {
    if (!selectMode) return;
    // Don't intercept clicks on interactive elements
    if ((e.target as Element).closest("button, a, input, [data-row-click-ignore]")) return;
    onToggleSelect(notification.id);
  };

  const rowContent = (
    <>
      {/* Type label */}
      <span
        className={cn(
          "w-44 shrink-0 truncate text-sm",
          isRead ? "font-normal text-muted-foreground" : "font-semibold text-foreground",
        )}
      >
        {notification.type}
      </span>

      {/* Message preview */}
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {truncatePreview(notification.customMsg)}
      </span>

      {/* Date */}
      <span
        className={cn(
          "shrink-0 text-xs tabular-nums",
          isRead ? "text-muted-foreground/70" : "font-medium text-foreground",
        )}
      >
        {formatDate(notification.dateSent)}
      </span>
    </>
  );

  return (
    <div
      data-marquee-entry-id={notification.id}
      className={cn(
        "group relative flex items-center first:rounded-t-md last:rounded-b-md border-b last:border-b-0 bg-card transition-colors hover:bg-muted/40",
        selected && "bg-primary/10",
        selectMode && "cursor-pointer select-none",
      )}
      onClick={handleRowClick}
    >
      {/* Left column: checkbox in select mode, unread dot otherwise */}
      <div className="flex w-8 shrink-0 items-center justify-center">
        {selectMode ? (
          <input
            type="checkbox"
            data-row-click-ignore
            className="size-4 rounded border-input accent-primary"
            checked={selected}
            onChange={() => onToggleSelect(notification.id)}
            aria-label={selected ? "Deselect" : "Select"}
          />
        ) : (
          !isRead && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />
        )}
      </div>

      {/* Main area — Link when not in select mode, div when selecting */}
      {selectMode ? (
        <div
          className={cn(
            "flex min-w-0 flex-1 items-baseline gap-3 py-3 pr-2",
            isRead && "opacity-60",
          )}
        >
          {rowContent}
        </div>
      ) : (
        <Link
          to={`${pathPrefix}/notifications/${notification.id}`}
          className={cn(
            "flex min-w-0 flex-1 items-baseline gap-3 py-3 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            isRead && "opacity-60",
          )}
        >
          {rowContent}
        </Link>
      )}

      {/* ... menu — shown on hover, hidden in select mode */}
      {!selectMode && (
        <div
          className="flex w-10 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
          data-row-click-ignore
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More options</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {isRead ? (
                <DropdownMenuItem onSelect={() => onMarkUnread(notification.id)}>
                  <Mail className="size-4" />
                  Mark as unread
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onMarkRead(notification.id)}>
                  <MailOpen className="size-4" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(notification.id)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Spacer so row width stays consistent in select mode */}
      {selectMode && <div className="w-10 shrink-0" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications page
// ---------------------------------------------------------------------------

function isTutorialNotificationsListPath(pathname: string): boolean {
  return /^\/tutorial\/notifications\/?$/.test(pathname);
}

export default function Notifications() {
  const location = useLocation();
  const pathPrefix = useAppPathPrefix();
  const ntTutorial = useNotificationTutorial();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // filters / sort
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // bulk select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { withCredentials: true })
      .then((res) => {
        if (!cancelled && res.data?.jobPosition === "admin") setIsAdmin(true);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onMarqueeSelect = useCallback(
    (entryIds: number[]) => {
      if (bulkActionLoading) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of entryIds) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        }
        return next;
      });
    },
    [bulkActionLoading],
  );

  const fetchNotifications = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await axios.get<NotificationItem[]>(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications`,
        { withCredentials: true },
      );
      setNotifications(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.error ?? "Failed to load notifications.");
      } else {
        setErrorMessage("Failed to load notifications.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!ntTutorial?.routeIsNotificationsTutorial) return;
    if (!isTutorialNotificationsListPath(location.pathname)) return;
    if (ntTutorial.phase === "sidebar_inbox_nav") {
      ntTutorial.notifyInboxListRouteEntered();
    }
  }, [ntTutorial, location.pathname]);

  const handleMarkUnread = useCallback(async (id: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/unread/${id}`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, dateRead: null } : n)),
      );
    } catch {
      // silently fail
    }
  }, []);

  const handleMarkRead = useCallback(async (id: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/read/${id}`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, dateRead: new Date().toISOString() } : n,
        ),
      );
    } catch {
      // silently fail
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${id}`,
        { withCredentials: true },
      );
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently fail
    }
  }, []);

  // ----- bulk actions -----

  const handleBulkMarkUnread = useCallback(async () => {
    if (!selectedIds.size) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          axios.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/notifications/unread/${id}`,
            {},
            { withCredentials: true },
          ),
        ),
      );
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, dateRead: null } : n)),
      );
      setSelectedIds(new Set());
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds]);

  const handleBulkMarkRead = useCallback(async () => {
    if (!selectedIds.size) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          axios.put(
            `${import.meta.env.VITE_BACKEND_URL}/api/notifications/read/${id}`,
            {},
            { withCredentials: true },
          ),
        ),
      );
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, dateRead: now } : n)),
      );
      setSelectedIds(new Set());
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedIds.size) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          axios.delete(
            `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${id}`,
            { withCredentials: true },
          ),
        ),
      );
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds]);

  const processed = useMemo(() => {
    let result = [...notifications];

    if (statusFilter === "unread") result = result.filter((n) => n.dateRead == null);
    else if (statusFilter === "read") result = result.filter((n) => n.dateRead != null);

    result.sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime();
        case "oldest":
          return new Date(a.dateSent).getTime() - new Date(b.dateSent).getTime();
        case "type-asc":
          return a.type.localeCompare(b.type);
        case "type-desc":
          return b.type.localeCompare(a.type);
      }
    });

    return result;
  }, [notifications, statusFilter, sortKey]);

  const allVisibleSelected =
    processed.length > 0 && processed.every((n) => selectedIds.has(n.id));

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const n of processed) next.add(n.id);
      return next;
    });
  };

  const isFiltered = statusFilter !== "all" || sortKey !== "newest";

  const clearFilters = () => {
    setStatusFilter("all");
    setSortKey("newest");
  };

  const unreadCount = notifications.filter((n) => n.dateRead == null).length;

  return (
    <section className="flex bg-muted/50 min-h-0 flex-1 flex-col overflow-auto p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <HelpHint contentClassName="max-w-sm">
              Your inbox for alerts and messages. Use All, Unread, and Read to filter; sort
              changes the order. Open Select to choose multiple notifications for bulk
              actions.
            </HelpHint>
          </span>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild>
              <Link to="/documents/announcements">
                <Megaphone className="size-4" />
                New announcement
              </Link>
            </Button>
          )}
          {!selectMode && (
            <button
              id="tutorial-inbox-select"
              type="button"
              onClick={() => setSelectMode(true)}
              className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Select
            </button>
          )}
          <button
            id="tutorial-inbox-refresh"
            type="button"
            onClick={fetchNotifications}
            disabled={bulkActionLoading}
            className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Status tabs */}
        <div
          id="tutorial-inbox-status-filter"
          className="flex rounded-md border bg-background p-0.5 text-sm"
        >
          {(["all", "unread", "read"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded px-3 py-1 capitalize transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="tutorial-inbox-sort"
              type="button"
              className={cn(
                "flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                sortKey !== "newest" && "border-foreground/40 font-medium",
              )}
            >
              <ArrowUpDown className="size-3.5" />
              {SORT_LABELS[sortKey]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        {isFiltered && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear
          </button>
        )}

        {/* Result count */}
        {!isLoading && !errorMessage && (
          <span className="ml-auto text-sm text-muted-foreground">
            {processed.length} of {notifications.length}
          </span>
        )}
      </div>

      {/* Bulk action bar — visible when in select mode */}
      {selectMode && (
        <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
          {/* Select all / deselect all button */}
          <button
            type="button"
            disabled={bulkActionLoading || processed.length === 0}
            onClick={allVisibleSelected ? () => setSelectedIds(new Set()) : selectAllVisible}
            className="rounded-md border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            {allVisibleSelected ? "Deselect all" : "Select all in view"}
          </button>

          {bulkActionLoading ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Processing…
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : ""}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={selectedIds.size === 0 || bulkActionLoading}
              onClick={handleBulkMarkUnread}
              className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Mail className="size-3.5" />
              Mark unread
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 || bulkActionLoading}
              onClick={handleBulkMarkRead}
              className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <MailOpen className="size-3.5" />
              Mark read
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 || bulkActionLoading}
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
            <div className="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              onClick={exitSelectMode}
              disabled={bulkActionLoading}
              className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <X className="size-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading notifications...</p>
      ) : errorMessage ? (
        <p className="text-destructive">{errorMessage}</p>
      ) : processed.length === 0 ? (
        <EmptyResultsState
          title={isFiltered ? "No results" : "No notifications"}
          description={
            isFiltered
              ? "Try changing filters or search to see more."
              : "You’re all caught up. New alerts will show up here."
          }
        />
      ) : (
        <SelectMarqueeLayer
          enabled={selectMode}
          blocked={bulkActionLoading}
          onCommit={onMarqueeSelect}
          className="rounded-md"
        >
          <div id="tutorial-inbox-list-overview" className="rounded-md border">
            {processed.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                selectMode={selectMode}
                selected={selectedIds.has(notification.id)}
                onToggleSelect={toggleSelect}
                onMarkUnread={handleMarkUnread}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                bulkActionLoading={bulkActionLoading}
                pathPrefix={pathPrefix}
              />
            ))}
          </div>
        </SelectMarqueeLayer>
      )}
    </section>
  );
}
