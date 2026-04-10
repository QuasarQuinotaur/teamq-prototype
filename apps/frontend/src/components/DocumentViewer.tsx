import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { renderAsync } from "docx-preview";
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

function getFileType(filename: string): "pdf" | "docx" | "unknown" {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
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
