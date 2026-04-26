import * as React from "react";
import { SidebarTrigger } from "@/elements/sidebar-elements.tsx";
import { Label } from "@/elements/label.tsx";
import { Textarea } from "@/elements/textarea.tsx";
import { Input } from "@/elements/input.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";
import {
  AssignEmployeesCombobox,
  type AssignEmployeeOption,
} from "@/components/service-requests/AssignEmployeesCombobox.tsx";
import type { Employee } from "db";

const base = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function Announcements() {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [assigneeIds, setAssigneeIds] = React.useState<number[]>([]);
  const [employees, setEmployees] = React.useState<AssignEmployeeOption[]>([]);

  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

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
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Announcements</h1>
          <HelpHint contentClassName="max-w-sm">
            Send a notification to selected employees. The title and optional message
            appear in each recipient&apos;s Notifications inbox.
          </HelpHint>
        </div>
      </header>

      {loadError ? (
        <p className="px-4 py-8 text-center text-destructive">{loadError}</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8"
        >

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Subject"
              disabled={disabled}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-message">Message</Label>
            <Textarea
              id="ann-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
              rows={6}
              disabled={disabled}
              className="min-h-[8rem] resize-y"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-recipients">Recipients</Label>
            <AssignEmployeesCombobox
              employees={employees}
              value={assigneeIds}
              onValueChange={setAssigneeIds}
              disabled={disabled}
              placeholder="Select employees…"
            />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          {success && <p className="text-sm text-emerald-600 dark:text-emerald-500">{success}</p>}

          <Button type="submit" disabled={disabled}>
            {submitting ? "Sending…" : "Send announcement"}
          </Button>
        </form>
      )}
    </div>
  );
}
