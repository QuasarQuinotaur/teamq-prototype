import { useCallback, useEffect, useMemo, useState } from "react";
import type { Content } from "db";
import { Button } from "@/elements/buttons/button.tsx";
import { Input } from "@/elements/input.tsx";
import { notifyContentCheckoutSync } from "@/lib/content-checkout-sync.ts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/Table.tsx";
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
import { EmptyResultsState } from "@/components/EmptyResultsState.tsx";
import { Search } from "lucide-react";

const apiBase = import.meta.env.VITE_BACKEND_URL;

type CheckedOutRow = Content & {
    checkedOutBy?: { firstName?: string; lastName?: string } | null;
};

function employeeName(row: CheckedOutRow): string {
    const who = row.checkedOutBy;
    return who ? `${who.firstName ?? ""} ${who.lastName ?? ""}`.trim() || "—" : "—";
}

export default function AdminCheckIn() {
    const [rows, setRows] = useState<CheckedOutRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search & filter state
    const [search, setSearch] = useState("");
    const [filterEmployee, setFilterEmployee] = useState("all");

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/content`, { credentials: "include" });
            if (!res.ok) {
                setError("Failed to load documents.");
                return;
            }
            const data: CheckedOutRow[] = await res.json();
            setRows(data.filter((c) => c.isCheckedOut));
        } catch {
            setError("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Unique employees for the filter dropdown
    const employeeOptions = useMemo(() => {
        const seen = new Map<string, string>();
        for (const r of rows) {
            const name = employeeName(r);
            if (name !== "—") seen.set(name, name);
        }
        return Array.from(seen.keys()).sort();
    }, [rows]);

    // Filtered view
    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            const name = employeeName(r);
            const matchesSearch =
                !q ||
                r.title.toLowerCase().includes(q) ||
                name.toLowerCase().includes(q);
            const matchesEmployee =
                filterEmployee === "all" || name === filterEmployee;
            return matchesSearch && matchesEmployee;
        });
    }, [rows, search, filterEmployee]);

    async function forceCheckIn(id: number) {
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

    async function forceCheckInAll() {
        if (rows.length === 0) return;
        setBulkBusy(true);
        setError(null);
        try {
            for (const c of rows) {
                const res = await fetch(`${apiBase}/api/content/checkin/${c.id}`, {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(
                        typeof body.error === "string"
                            ? body.error
                            : `Check-in failed for "${c.title}"`,
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
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Check In</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    View all currently checked-out documents and force check them in.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[16rem] flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        placeholder="Search by title or employee…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {/* Employee filter */}
                <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    disabled={employeeOptions.length === 0}
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                    <option value="all">All employees</option>
                    {employeeOptions.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void load()}
                    disabled={loading || bulkBusy}
                >
                    Refresh
                </Button>

                {/* Check in all — with confirmation */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            type="button"
                            size="sm"
                            disabled={loading || bulkBusy || rows.length === 0}
                        >
                            {bulkBusy
                                ? "Checking in…"
                                : `Check in all${rows.length > 0 ? ` (${rows.length})` : ""}`}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Check in all documents?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will force check in all {rows.length} checked-out{" "}
                                {rows.length === 1 ? "document" : "documents"}, regardless of who
                                has them checked out.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                size="sm"
                                onClick={() => void forceCheckInAll()}
                            >
                                Check in all
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {error && (
                <p className="text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="animate-spin inline-block size-4 rounded-full border-2 border-current border-t-transparent" />
                    Loading…
                </div>
            ) : rows.length === 0 ? (
                <EmptyResultsState
                    title="No checked-out documents"
                    description="All documents are currently available."
                />
            ) : filteredRows.length === 0 ? (
                <EmptyResultsState
                    title="No results"
                    description="Try adjusting your search or filter."
                />
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader className="bg-background">
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Checked out by</TableHead>
                                <TableHead>Checked out on</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRows.map((c, index) => {
                                const name = employeeName(c);
                                const when = c.checkedOutOn
                                    ? new Date(c.checkedOutOn).toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                      })
                                    : "—";
                                return (
                                    <TableRow
                                        key={c.id}
                                        className={
                                            index % 2 === 0 ? "bg-background" : "bg-muted/30"
                                        }
                                    >
                                        <TableCell
                                            className="max-w-[20rem] truncate font-medium"
                                            title={c.title}
                                        >
                                            {c.title}
                                        </TableCell>
                                        <TableCell>{name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {when}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Per-row force check in — with confirmation */}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        disabled={busyId === c.id || bulkBusy}
                                                    >
                                                        {busyId === c.id
                                                            ? "Checking in…"
                                                            : "Force check in"}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent size="sm">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Force check in?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will force check in{" "}
                                                            <strong>{c.title}</strong>, currently
                                                            held by {name}. Any unsaved edits by
                                                            that user may be lost.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel size="sm">
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            size="sm"
                                                            onClick={() =>
                                                                void forceCheckIn(c.id)
                                                            }
                                                        >
                                                            Force check in
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
