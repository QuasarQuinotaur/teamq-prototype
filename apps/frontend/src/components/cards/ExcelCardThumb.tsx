/**
 * Client-side Excel/CSV thumbnail: SheetJS parses the first sheet, the first
 * N rows × M columns are rendered as a scaled mini-table that mirrors the
 * ExcelSkeleton colour palette so the transition is seamless.
 */

import * as React from "react";
import * as XLSX from "xlsx";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const MAX_ROWS = 20;
const MAX_COLS = 10;

type Row = (string | number | boolean | null)[];

function ExcelThumbError() {
    return (
        <div className="flex size-full items-center justify-center bg-muted">
            <FileIcon className="size-10 text-muted-foreground" aria-hidden />
        </div>
    );
}

type ExcelCardThumbProps = {
    url: string;
    /** Fired once when the table is ready or an error placeholder is shown. */
    onReady?: () => void;
};

export default function ExcelCardThumb({ url, onReady }: ExcelCardThumbProps) {
    const onReadyRef = React.useRef(onReady);
    React.useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    const readyFired = React.useRef(false);
    const clipRef = React.useRef<HTMLDivElement>(null);
    const scaleBlockRef = React.useRef<HTMLDivElement>(null);

    const [rows, setRows] = React.useState<Row[] | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const [scale, setScale] = React.useState(0.22);

    const fireReady = React.useCallback(() => {
        if (readyFired.current) return;
        readyFired.current = true;
        onReadyRef.current?.();
    }, []);

    React.useEffect(() => {
        readyFired.current = false;
    }, [url]);

    React.useEffect(() => {
        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;

        setLoading(true);
        setError(false);
        setRows(null);

        const updateScale = () => {
            if (cancelled) return;
            const clip = clipRef.current;
            const block = scaleBlockRef.current;
            if (!clip || !block) return;
            const cw = clip.clientWidth;
            const ch = clip.clientHeight;
            if (cw < 8 || ch < 8) return;
            const iw = block.scrollWidth;
            const ih = block.scrollHeight;
            if (iw < 8 || ih < 8) return;
            // "contain": scale up or down so the table fills as much of the
            // card as possible without either axis overflowing.
            setScale(Math.min(cw / iw, ch / ih));
        };

        void fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Fetch failed");
                return res.arrayBuffer();
            })
            .then((buf) => {
                if (cancelled) return;
                const workbook = XLSX.read(buf, { type: "array", sheetRows: MAX_ROWS });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) throw new Error("No sheets");
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null });
                const clipped = data
                    .slice(0, MAX_ROWS)
                    .map((r) => (r as Row).slice(0, MAX_COLS));
                if (cancelled) return;
                setRows(clipped);
                setLoading(false);
                fireReady();
                requestAnimationFrame(() => {
                    updateScale();
                    const clip = clipRef.current;
                    const block = scaleBlockRef.current;
                    if (!clip || !block || cancelled) return;
                    resizeObserver = new ResizeObserver(() => updateScale());
                    resizeObserver.observe(clip);
                    resizeObserver.observe(block);
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setLoading(false);
                    setError(true);
                    fireReady();
                }
            });

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
        };
    }, [url, fireReady]);

    return (
        <div
            ref={clipRef}
            className={cn("pointer-events-none relative size-full overflow-hidden bg-white")}
        >
            {loading ? (
                <div
                    className="absolute inset-0 z-10 bg-muted-foreground/32 motion-safe:animate-[pulse_1.15s_cubic-bezier(0.4,0,0.6,1)_infinite] dark:bg-muted-foreground/40 motion-reduce:animate-none"
                    aria-hidden
                />
            ) : null}
            {error ? (
                <ExcelThumbError />
            ) : rows ? (
                <div
                    ref={scaleBlockRef}
                    className="absolute left-0 top-0 origin-top-left will-change-transform"
                    style={{ transform: `scale(${scale})` }}
                >
                    <table
                        style={{
                            borderCollapse: "collapse",
                            tableLayout: "fixed",
                            fontFamily: "ui-monospace, monospace",
                            fontSize: 11,
                            lineHeight: "1.3",
                            backgroundColor: "#ffffff",
                        }}
                    >
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr
                                    key={ri}
                                    style={{
                                        backgroundColor:
                                            ri === 0
                                                ? "#d0d0d0"
                                                : ri % 2 === 0
                                                  ? "#ffffff"
                                                  : "#f3f3f3",
                                    }}
                                >
                                    {row.map((cell, ci) => (
                                        <td
                                            key={ci}
                                            style={{
                                                padding: "2px 5px",
                                                border: "1px solid #e4e4e4",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                maxWidth: 96,
                                                minWidth: 40,
                                                fontWeight: ri === 0 ? 600 : 400,
                                                color: "#1a1a1a",
                                            }}
                                        >
                                            {cell != null ? String(cell) : ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
