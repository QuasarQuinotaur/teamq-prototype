import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";
import { Button } from "@/elements/buttons/button.tsx";
import {
    ArrowLeftIcon,
    ArrowSquareOutIcon,
    WarningIcon,
} from "@phosphor-icons/react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

type DocumentViewerProps = {
    url: string;
    filename: string;
    title: string;
    onClose: () => void;
};

function getFileType(filename: string): "pdf" | "docx" | "doc" | "pptx" | "ppt" | "xlsx" | "xls" | "unknown" {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
    if (ext === "doc") return "doc";
    if (ext === "pptx") return "pptx";
    if (ext === "ppt") return "ppt";
    if (ext === "xlsx") return "xlsx";
    if (ext === "xls") return "xls";
    return "unknown";
}

export default function DocumentViewer({ url, filename, title, onClose }: DocumentViewerProps) {
    const fileType = getFileType(filename);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
                <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
                    <ArrowLeftIcon />
                    Back
                </Button>
                <span className="flex-1 font-medium text-sm truncate">{title}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, "_blank")}
                    className="gap-1.5 shrink-0"
                >
                    <ArrowSquareOutIcon />
                    Open in new tab
                </Button>
            </div>
            <div className="flex-1 overflow-auto">
                {fileType === "pdf" && <PdfViewer url={url} />}
                {fileType === "docx" && <DocxViewer url={url} />}
                {fileType === "doc" && <DocViewer url={url} />}
                {(fileType === "pptx" || fileType === "ppt") && <PptViewer url={url} />}
                {(fileType === "xlsx" || fileType === "xls") && <ExcelViewer url={url} />}
                {fileType === "unknown" && <UnknownViewer url={url} />}
            </div>
        </div>
    );
}

function PdfViewer({ url }: { url: string }) {
    const [numPages, setNumPages] = React.useState<number>(0);
    const [containerWidth, setContainerWidth] = React.useState<number>(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="flex flex-col items-center gap-4 py-6 px-4">
            <Document
                file={url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<LoadingState />}
                error={<ErrorState />}
            >
                {Array.from({ length: numPages }, (_, i) => (
                    <Page
                        key={i + 1}
                        pageNumber={i + 1}
                        width={containerWidth ? Math.min(containerWidth - 32, 900) : undefined}
                        className="mb-4"
                    />
                ))}
            </Document>
        </div>
    );
}

function DocxViewer({ url }: { url: string }) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        if (!containerRef.current) return;
        setLoading(true);
        setError(false);

        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Fetch failed");
                return res.blob();
            })
            .then((blob) =>
                renderAsync(blob, containerRef.current!, undefined, {
                    className: "docx-preview-container",
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    ignoreFonts: false,
                    breakPages: true,
                    useBase64URL: true,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                })
            )
            .then(() => setLoading(false))
            .catch(() => {
                setLoading(false);
                setError(true);
            });
    }, [url]);

    return (
        <div className="flex flex-col items-center py-6 px-4">
            {loading && <LoadingState />}
            {error && <ErrorState />}
            <div
                ref={containerRef}
                className="w-full max-w-4xl shadow-sm"
                style={{ display: loading || error ? "none" : undefined }}
            />
        </div>
    );
}

/** .doc has no server-side text extraction in the API; prompt opening the signed URL instead. */
function DocViewer({ url }: { url: string }) {
    return (
        <div className="flex flex-col items-center py-6 px-4 gap-4">
            <div className="w-full max-w-4xl flex items-start gap-3 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <WarningIcon size={18} className="mt-0.5 shrink-0" />
                <span>
                    This is an older file format (.doc). Inline preview is not available.{" "}
                    <button
                        className="underline font-medium hover:text-yellow-900"
                        onClick={() => window.open(url, "_blank")}
                    >
                        Open in new tab
                    </button>{" "}
                    for the best experience.
                </span>
            </div>
        </div>
    );
}

function PptViewer({ url }: { url: string }) {
    const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

    return (
        <div className="flex flex-col h-full py-6 px-4">
            <iframe
                src={officeEmbedUrl}
                className="w-full flex-1 border-0 rounded shadow-sm"
                style={{ minHeight: "600px" }}
                allowFullScreen
            />
        </div>
    );
}

type SheetData = (string | number | boolean | null)[][];

function ExcelViewer({ url }: { url: string }) {
    const [sheets, setSheets] = React.useState<Record<string, SheetData>>({});
    const [sheetNames, setSheetNames] = React.useState<string[]>([]);
    const [activeSheet, setActiveSheet] = React.useState<string>("");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        setLoading(true);
        setError(false);
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Fetch failed");
                return res.arrayBuffer();
            })
            .then((buffer) => {
                const workbook = XLSX.read(buffer, { type: "array" });
                const parsed: Record<string, SheetData> = {};
                for (const name of workbook.SheetNames) {
                    parsed[name] = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
                        workbook.Sheets[name],
                        { header: 1, defval: null }
                    );
                }
                setSheets(parsed);
                setSheetNames(workbook.SheetNames);
                setActiveSheet(workbook.SheetNames[0] ?? "");
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                setError(true);
            });
    }, [url]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState />;

    const rows = sheets[activeSheet] ?? [];
    const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

    return (
        <div className="flex flex-col h-full">
            {sheetNames.length > 1 && (
                <div className="flex gap-1 px-4 pt-4 flex-wrap shrink-0">
                    {sheetNames.map((name) => (
                        <button
                            key={name}
                            onClick={() => setActiveSheet(name)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
                                name === activeSheet
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex-1 overflow-auto px-4 py-4">
                <div className="rounded border overflow-auto">
                    <table className="text-xs border-collapse w-full">
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri} className={ri === 0 ? "bg-muted font-medium" : "hover:bg-muted/40"}>
                                    {Array.from({ length: colCount }, (_, ci) => {
                                        const cell = row[ci];
                                        return (
                                            <td
                                                key={ci}
                                                className="border px-2 py-1 whitespace-nowrap max-w-[200px] truncate"
                                            >
                                                {cell === null || cell === undefined ? "" : String(cell)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">
                            This sheet is empty.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function UnknownViewer({ url }: { url: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground py-16">
            <WarningIcon size={40} />
            <p className="text-sm">Preview not available for this file type.</p>
            <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                <ArrowSquareOutIcon />
                Download file
            </Button>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading document…
        </div>
    );
}

function ErrorState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <WarningIcon size={32} />
            <p className="text-sm">Failed to load document.</p>
        </div>
    );
}
