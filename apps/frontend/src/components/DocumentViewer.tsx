import * as React from "react";
import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import type { IDocument } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { Button } from "@/elements/buttons/button.tsx";
import { ArrowLeftIcon, SidebarSimpleIcon } from "@phosphor-icons/react";

export type DocumentPanePayload = {
    url: string;
    filename: string;
    title: string;
};

type DocumentViewerProps = {
    url: string;
    filename: string;
    title: string;
    onClose: () => void;
    /** Fullscreen-only: offer entering split workspace (document-like files). */
    canEnterSplit?: boolean;
    onEnterSplit?: () => void;
};

/** Hoisted so DocViewer config identity is stable across memoized re-renders. */
function NoRendererFallback({
    document: doc,
    fileName,
}: {
    document: IDocument | undefined;
    fileName: string;
}) {
    const uri = doc?.uri ?? "";

    React.useEffect(() => {
        if (!uri) return;
        let cancelled = false;
        const name = fileName || "download";

        const triggerDownload = (href: string, useDownloadAttr: boolean) => {
            const a = document.createElement("a");
            a.href = href;
            if (useDownloadAttr) a.download = name;
            a.rel = "noopener";
            a.click();
        };

        const run = async () => {
            try {
                const res = await fetch(uri);
                if (!res.ok) throw new Error("fetch failed");
                const blob = await res.blob();
                if (cancelled) return;
                const obj = URL.createObjectURL(blob);
                triggerDownload(obj, true);
                URL.revokeObjectURL(obj);
            } catch {
                if (cancelled) return;
                triggerDownload(uri, true);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [uri, fileName]);

    if (!uri) return null;

    return <div className="h-full min-h-0 w-full" aria-hidden />;
}

const DOC_VIEWER_STATIC_CONFIG = {
    header: { disableHeader: true },
    noRenderer: {
        overrideComponent: NoRendererFallback,
    },
};

/**
 * Isolated from parent re-renders: only re-renders when `url` / `filename` change
 * so the sibling split pane updating does not re-run react-doc-viewer.
 */
const DocumentCanvas = React.memo(function DocumentCanvas({ url, filename }: { url: string; filename: string }) {
    const documents = React.useMemo<IDocument[]>(
        () => [{ uri: url, fileName: filename }],
        [url, filename],
    );

    return (
        <div className="flex-1 min-h-0 w-full flex flex-col [&_#react-doc-viewer]:min-h-0 [&_#react-doc-viewer]:h-full">
            <DocViewer
                key={url}
                documents={documents}
                pluginRenderers={DocViewerRenderers}
                config={DOC_VIEWER_STATIC_CONFIG}
                className="flex-1 min-h-0 w-full border-0"
                style={{ width: "100%", height: "100%", minHeight: 0 }}
            />
        </div>
    );
});

export { DocumentCanvas };

function paneDocEqual(a: DocumentPanePayload, b: DocumentPanePayload): boolean {
    return a.url === b.url && a.filename === b.filename && a.title === b.title;
}

/** Memoized so only the pane whose `doc` changes re-renders its DocViewer subtree. */
export const PaneDocumentViewer = React.memo(function PaneDocumentViewer({
    doc,
    onBackToGrid,
}: {
    doc: DocumentPanePayload;
    onBackToGrid: () => void;
}) {
    return (
        <div className="flex h-full min-h-0 flex-col bg-background">
            <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
                <Button variant="ghost" size="sm" onClick={onBackToGrid} className="gap-1.5 shrink-0">
                    <ArrowLeftIcon />
                    Back
                </Button>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{doc.title}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <DocumentCanvas url={doc.url} filename={doc.filename} />
            </div>
        </div>
    );
}, (prev, next) => paneDocEqual(prev.doc, next.doc));

export default function DocumentViewer({
    url,
    filename,
    title,
    onClose,
    canEnterSplit = false,
    onEnterSplit,
}: DocumentViewerProps) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
                <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
                    <ArrowLeftIcon />
                    Back
                </Button>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
                {canEnterSplit && onEnterSplit ? (
                    <Button variant="outline" size="sm" type="button" onClick={onEnterSplit} className="shrink-0 gap-1.5">
                        <SidebarSimpleIcon className="size-4" />
                        Split view
                    </Button>
                ) : null}
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <DocumentCanvas url={url} filename={filename} />
            </div>
        </div>
    );
}
