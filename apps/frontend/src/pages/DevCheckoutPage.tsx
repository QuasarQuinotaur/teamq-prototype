import { useCallback, useEffect, useState } from "react";
import type { Content } from "db";
import { Button } from "@/elements/buttons/button.tsx";
import { notifyContentCheckoutSync } from "@/lib/content-checkout-sync.ts";

const apiBase = import.meta.env.VITE_BACKEND_URL;

type ContentRow = Content & {
    checkedOutBy?: { firstName?: string; lastName?: string } | null;
};

export default function DevCheckoutPage() {
    const [rows, setRows] = useState<ContentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        const res = await fetch(`${apiBase}/api/content`, { credentials: "include" });
        if (!res.ok) {
            setError("Failed to load documents.");
            setLoading(false);
            return;
        }
        const data: ContentRow[] = await res.json();
        setRows(data.filter((c) => c.isCheckedOut));
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    async function checkIn(id: number) {
        setBusyId(id);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/api/content/checkin/${id}`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(typeof body.error === "string" ? body.error : "Check-in failed");
            }
            notifyContentCheckoutSync();
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Check-in failed");
        } finally {
            setBusyId(null);
        }
    }

    async function checkInAll() {
        const checked = rows;
        if (checked.length === 0) return;
        setBulkBusy(true);
        setError(null);
        try {
            for (const c of checked) {
                const res = await fetch(`${apiBase}/api/content/checkin/${c.id}`, {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(
                        typeof body.error === "string"
                            ? body.error
                            : `Check-in failed for id ${c.id}`,
                    );
                }
            }
            notifyContentCheckoutSync();
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Bulk check-in failed");
        } finally {
            setBulkBusy(false);
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Dev: checked-out documents</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Admin-only. Not linked in the sidebar. POST /api/content runs a 5-minute stale
                    checkout sweep; this page force check-in for development.
                </p>
            </div>

            {error ? (
                <p className="text-sm text-destructive" role="alert">
                    {error}
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                    Refresh
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={() => void checkInAll()}
                    disabled={loading || bulkBusy || rows.length === 0}
                >
                    {bulkBusy ? "Checking in…" : "Check in all"}
                </Button>
            </div>

            {!loading && rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checked-out documents.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[32rem] text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50 text-left">
                                <th className="px-3 py-2 font-medium">ID</th>
                                <th className="px-3 py-2 font-medium">Title</th>
                                <th className="px-3 py-2 font-medium">Checked out by</th>
                                <th className="px-3 py-2 font-medium">Checked out on</th>
                                <th className="px-3 py-2 font-medium w-[1%]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((c) => {
                                const who = c.checkedOutBy;
                                const name = who
                                    ? `${who.firstName ?? ""} ${who.lastName ?? ""}`.trim() || "—"
                                    : "—";
                                const when = c.checkedOutOn
                                    ? new Date(c.checkedOutOn).toLocaleString()
                                    : "—";
                                return (
                                    <tr key={c.id} className="border-b border-border/80 last:border-0">
                                        <td className="px-3 py-2 tabular-nums">{c.id}</td>
                                        <td className="px-3 py-2 max-w-[14rem] truncate" title={c.title}>
                                            {c.title}
                                        </td>
                                        <td className="px-3 py-2">{name}</td>
                                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                            {when}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                disabled={busyId === c.id}
                                                onClick={() => void checkIn(c.id)}
                                            >
                                                {busyId === c.id ? "…" : "Check in"}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
