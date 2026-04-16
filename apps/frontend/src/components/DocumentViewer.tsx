import * as React from "react";
import DocViewer, { DocViewerRenderers, type IDocument } from "@iamjariwala/react-doc-viewer";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { Button } from "@/elements/buttons/button.tsx";
import { ArrowLeftIcon } from "@phosphor-icons/react";

type DocumentViewerProps = {
    url: string;
    filename: string;
    title: string;
    onClose: () => void;
};

export default function DocumentViewer({ url, filename, title, onClose }: DocumentViewerProps) {
    const documents = React.useMemo<IDocument[]>(
        () => [{ uri: url, fileName: filename }],
        [url, filename],
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
                <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
                    <ArrowLeftIcon />
                    Back
                </Button>
                <span className="flex-1 font-medium text-sm truncate">{title}</span>
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 w-full flex flex-col [&_#react-doc-viewer]:min-h-0 [&_#react-doc-viewer]:h-full">
                    <DocViewer
                        key={url}
                        documents={documents}
                        pluginRenderers={DocViewerRenderers}
                        config={{
                            header: { disableHeader: true },
                            noRenderer: {
                                overrideComponent: NoRendererFallback,
                            },
                        }}
                        className="flex-1 min-h-0 w-full border-0"
                        style={{ width: "100%", height: "100%", minHeight: 0 }}
                    />
                </div>
            </div>
        </div>
    );
}

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

    return <div className="h-full w-full min-h-0" aria-hidden />;
}
