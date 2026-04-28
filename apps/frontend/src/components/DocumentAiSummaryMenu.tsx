import * as React from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparkleIcon } from "@phosphor-icons/react";
import { Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/elements/buttons/button.tsx";
import { cn } from "@/lib/utils.ts";

const apiBase = import.meta.env.VITE_BACKEND_URL;

/** Browser-side cap so the UI does not spin forever if the backend hangs. */
const SUMMARY_FETCH_TIMEOUT_MS = 200_000;

/** Backend streams SSE (`: ping` comments + final `done` / `error` events) to avoid idle timeouts. */
async function readSummaryMarkdownFromResponse(res: Response): Promise<string> {
    if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        const errMsg =
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof (body as { error: unknown }).error === "string"
                ? (body as { error: string }).error
                : null;
        throw new Error(errMsg || `Request failed (${res.status})`);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/event-stream")) {
        const body: unknown = await res.json();
        const md =
            typeof body === "object" &&
            body !== null &&
            "markdown" in body &&
            typeof (body as { markdown: unknown }).markdown === "string"
                ? (body as { markdown: string }).markdown
                : null;
        if (md == null) {
            throw new Error("Invalid response from server");
        }
        return md;
    }

    if (!res.body) {
        throw new Error("No response body");
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let carry = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        carry += dec.decode(value, { stream: true });

        for (;;) {
            const sep = carry.indexOf("\n\n");
            if (sep === -1) {
                break;
            }
            const block = carry.slice(0, sep);
            carry = carry.slice(sep + 2);

            if (block.startsWith(":")) {
                continue;
            }

            let event = "message";
            let data = "";
            for (const line of block.split("\n")) {
                if (line.startsWith("event:")) {
                    event = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    data += line.slice(5).trimStart();
                }
            }

            if (event === "done") {
                const parsed = JSON.parse(data) as { markdown?: unknown };
                if (typeof parsed.markdown !== "string") {
                    throw new Error("Invalid summary payload");
                }
                return parsed.markdown;
            }
            if (event === "error") {
                const parsed = JSON.parse(data) as { error?: unknown };
                throw new Error(
                    typeof parsed.error === "string"
                        ? parsed.error
                        : "Summary failed",
                );
            }
        }
    }

    throw new Error("Connection closed before summary completed");
}

const markdownBodyClass = cn(
    "min-h-0 text-sm leading-relaxed text-foreground",
    "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:scroll-mt-4 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight first:[&_h2]:mt-0",
    "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold",
    "[&_p]:my-2 [&_p]:text-pretty",
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
    "[&_li]:my-0.5",
    "[&_strong]:font-semibold",
    "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
    "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.85em]",
    "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm",
    "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium",
    "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5",
    "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
    "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
);

/**
 * One-click AI summary: opens a panel over the document viewer area (parent must be `relative`).
 * When `toolbarSlot` is set, the open action is portaled there (e.g. document header). Otherwise
 * a floating top-right control is used.
 */
export function DocumentAiSummaryMenu({
    contentId,
    toolbarSlot = null,
}: {
    contentId: number;
    /** Mount the trigger button in this element (e.g. header toolbar next to Split view). */
    toolbarSlot?: HTMLElement | null;
}) {
    const [panelOpen, setPanelOpen] = React.useState(false);
    const [markdown, setMarkdown] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const fetchAbortRef = React.useRef<AbortController | null>(null);
    const userClosedFetchRef = React.useRef(false);

    const closePanel = React.useCallback(() => {
        userClosedFetchRef.current = true;
        fetchAbortRef.current?.abort();
        fetchAbortRef.current = null;
        setPanelOpen(false);
        setMarkdown(null);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        if (!panelOpen) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closePanel();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [panelOpen, closePanel]);

    const runSummary = React.useCallback(async () => {
        userClosedFetchRef.current = false;
        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        setPanelOpen(true);
        setMarkdown(null);
        setLoading(true);
        const url = `${apiBase}/api/content/${contentId}/summary`;
        const t0 = performance.now();
        console.info("[summary] fetch start", { contentId, url });
        const timeoutId = window.setTimeout(() => {
            controller.abort();
        }, SUMMARY_FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: "POST",
                credentials: "include",
                signal: controller.signal,
            });

            console.info("[summary] fetch response", {
                contentId,
                status: res.status,
                contentType: res.headers.get("content-type"),
                ms: Math.round(performance.now() - t0),
            });
            const md = await readSummaryMarkdownFromResponse(res);
            setMarkdown(md);
            console.info("[summary] markdown received", {
                contentId,
                chars: md.length,
                totalMs: Math.round(performance.now() - t0),
            });
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                if (userClosedFetchRef.current) {
                    userClosedFetchRef.current = false;
                    return;
                }
                toast.error(
                    `Summary timed out after ${SUMMARY_FETCH_TIMEOUT_MS / 1000}s. Check the backend terminal for [summary] logs.`,
                );
                closePanel();
                return;
            }
            const isTypeError = e instanceof TypeError;
            console.error("[summary] fetch failed", {
                contentId,
                ms: Math.round(performance.now() - t0),
                error: e,
            });
            let msg: string;
            if (isTypeError) {
                msg =
                    "Could not reach the server (connection dropped or refused). " +
                    "Confirm `pnpm dev` is running the backend on port 3000 and watch that terminal for crashes. " +
                    "For long AI requests, set VITE_BACKEND_URL=http://localhost:5173 in .env so traffic goes through the Vite proxy, then restart Vite.";
            } else if (e instanceof Error) {
                msg = e.message;
            } else {
                msg = "Something went wrong";
            }
            toast.error(msg);
            closePanel();
        } finally {
            window.clearTimeout(timeoutId);
            if (fetchAbortRef.current === controller) {
                fetchAbortRef.current = null;
            }
            setLoading(false);
        }
    }, [contentId, closePanel]);

    const trigger = !panelOpen ? (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("shrink-0 gap-1.5 shadow-sm", !toolbarSlot && "absolute top-3 right-3 z-10")}
            aria-label="Summarize"
            onClick={() => void runSummary()}
        >
            <SparkleIcon className="size-4" />
            Summarize
        </Button>
    ) : null;

    return (
        <>
            {trigger
                ? toolbarSlot
                    ? createPortal(trigger, toolbarSlot)
                    : trigger
                : null}

            {panelOpen ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ai-summary-title"
                    className="absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden outline-none"
                >
                    <div className="pointer-events-none absolute inset-0 bg-background/50 supports-backdrop-filter:backdrop-blur-xs" />

                    <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-popover/95 text-popover-foreground ring-1 ring-foreground/10 backdrop-blur-sm">
                        <div className="flex shrink-0 items-center justify-center gap-2 border-b border-border/80 px-10 py-3 sm:px-12">
                            <h2
                                id="ai-summary-title"
                                className="font-heading text-center text-base leading-none font-medium"
                            >
                                AI summary
                            </h2>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-2 right-2 shrink-0"
                                aria-label="Close summary"
                                onClick={closePanel}
                            >
                                <XIcon className="size-4" />
                            </Button>
                        </div>

                        <div
                            className={cn(
                                "flex min-h-0 flex-1 px-30 flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                            )}
                        >
                            <div
                                className={cn(
                                    "flex flex-col gap-4 px-6 pt-4 pb-20 sm:px-8 sm:pb-24",
                                )}
                            >
                                {loading ? (
                                    <div
                                        className="flex items-center justify-center gap-2 py-12 text-muted-foreground"
                                        aria-live="polite"
                                    >
                                        <Loader2Icon className="size-6 animate-spin" />
                                        <span>Generating summary…</span>
                                    </div>
                                ) : markdown != null ? (
                                    <div className={markdownBodyClass}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {markdown}
                                        </ReactMarkdown>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
