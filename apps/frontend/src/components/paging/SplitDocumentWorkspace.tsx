import * as React from "react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/resizable.tsx";
import { PaneDocumentViewer, type DocumentPanePayload } from "@/components/DocumentViewer.tsx";
import { cn } from "@/lib/utils.ts";

type SplitDocumentWorkspaceProps = {
    leftDoc: DocumentPanePayload | null;
    rightDoc: DocumentPanePayload | null;
    onLeftBackToGrid: () => void;
    onRightBackToGrid: () => void;
    leftGrid: React.ReactNode;
    rightGrid: React.ReactNode;
};

/**
 * Keeps the grid mounted while a document is open so the other pane and scroll/back state
 * are not torn down when one side toggles viewer ↔ grid.
 */
function SplitPaneSlot({
    doc,
    onBackToGrid,
    grid,
}: {
    doc: DocumentPanePayload | null;
    onBackToGrid: () => void;
    grid: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div
                className={cn(
                    "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                    doc && "pointer-events-none invisible",
                )}
                aria-hidden={doc ? true : undefined}
            >
                {grid}
            </div>
            {doc ? (
                <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-background">
                    <PaneDocumentViewer doc={doc} onBackToGrid={onBackToGrid} />
                </div>
            ) : null}
        </div>
    );
}

/**
 * Two-pane split: each side keeps its grid mounted; the viewer overlays when open.
 */
export default function SplitDocumentWorkspace({
    leftDoc,
    rightDoc,
    onLeftBackToGrid,
    onRightBackToGrid,
    leftGrid,
    rightGrid,
}: SplitDocumentWorkspaceProps) {
    return (
        <ResizablePanelGroup orientation="horizontal" className="flex min-h-0 flex-1">
            <ResizablePanel defaultSize="50%" minSize="25%" className="flex min-h-0 min-w-0 flex-col p-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/30">
                    <SplitPaneSlot doc={leftDoc} onBackToGrid={onLeftBackToGrid} grid={leftGrid} />
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="w-2 bg-border" />
            <ResizablePanel defaultSize="50%" minSize="25%" className="flex min-h-0 min-w-0 flex-col p-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/30">
                    <SplitPaneSlot doc={rightDoc} onBackToGrid={onRightBackToGrid} grid={rightGrid} />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
