import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import { Label } from "@/elements/label.tsx";
import { Textarea } from "@/elements/textarea.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import {
  AssignEmployeesCombobox,
  type AssignEmployeeOption,
} from "@/components/service-requests/AssignEmployeesCombobox.tsx";
import type { Employee } from "db";

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function Announcements() {
  const navigate = useNavigate();
  const titleRef = React.useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [assigneeIds, setAssigneeIds] = React.useState<number[]>([]);
  const [employees, setEmployees] = React.useState<AssignEmployeeOption[]>([]);

  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const resizeTitle = React.useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, []);

  React.useLayoutEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${base}/employee`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Could not load employees.");
        return r.json() as Promise<Employee[]>;
      })
      .then((emps) => {
        if (cancelled) return;
        setEmployees(
          emps.map((e) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            jobPosition: e.jobPosition,
          })),
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load employees.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleBack() {
    navigate("/documents/notifications");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSubmitError("Please enter a title.");
      return;
    }
    if (assigneeIds.length === 0) {
      setSubmitError("Select at least one recipient.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${base}/notifications/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: trimmedTitle,
          employeeIds: assigneeIds,
          customMsg: message.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          typeof data.error === "string" ? data.error : "Failed to send announcement.",
        );
        return;
      }
      const count = typeof data.count === "number" ? data.count : assigneeIds.length;
      setSuccess(`Sent to ${count} recipient${count === 1 ? "" : "s"}.`);
      setTitle("");
      setMessage("");
      setAssigneeIds([]);
    } catch {
      setSubmitError("Failed to send announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = loadError != null || submitting;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
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
              <label htmlFor="ann-title" className="sr-only">
                Title
              </label>
              <textarea
                id="ann-title"
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={1}
                placeholder="Announcement title"
                disabled={disabled}
                className="w-full resize-none border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0 md:text-4xl"
              />
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs sm:pt-1">
              <Label htmlFor="ann-recipients">Recipients</Label>
              <AssignEmployeesCombobox
                employees={employees}
                employeeIds={assigneeIds}
                onValueChange={setAssigneeIds}
                disabled={disabled}
                placeholder="Select employees…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-message">Message</Label>
            <Textarea
              id="ann-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add details for your announcement…"
              disabled={disabled}
              className="min-h-28"
            />
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-500" role="status">
              {success}
            </p>
          ) : null}

          <div className="ml-auto flex justify-end border-t border-border pt-6">
            <Button type="submit" disabled={disabled}>
              {submitting ? "Sending…" : "Send announcement"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
