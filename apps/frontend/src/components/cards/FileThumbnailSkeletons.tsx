/** Spreadsheet skeleton — used for xlsx/xls and csv. */
function ExcelSkeleton() {
    return (
        <div className="relative size-full overflow-hidden bg-white">
            <div
                className="absolute inset-[6px] flex flex-col overflow-hidden rounded-[2px]"
                style={{ gap: 1, backgroundColor: "#e4e4e4" }}
            >
                {/* Header row */}
                <div className="flex shrink-0 h-[14%]" style={{ gap: 1 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: "#d0d0d0" }} />
                    ))}
                </div>
                {/* Data rows */}
                {[0, 1, 2, 3, 4].map((r) => (
                    <div key={r} className="flex flex-1" style={{ gap: 1 }}>
                        {[0, 1, 2, 3].map((c) => (
                            <div
                                key={c}
                                className="flex-1"
                                style={{ backgroundColor: r % 2 === 0 ? "#ffffff" : "#f3f3f3" }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Slide skeleton — used for pptx/ppt. */
function PowerPointSkeleton() {
    return (
        <div className="relative size-full flex items-center justify-center overflow-hidden bg-white">
            <div
                className="w-[78%] h-[66%] flex flex-col rounded-[2px] overflow-hidden"
                style={{ backgroundColor: "#ffffff", boxShadow: "0 1px 6px rgba(0,0,0,0.15)" }}
            >
                {/* Title band */}
                <div
                    className="shrink-0 h-[28%] flex flex-col justify-center px-[8%] gap-[10%]"
                    style={{ backgroundColor: "#f0f0f0" }}
                >
                    <div className="h-[28%] w-[62%] rounded-[1px]" style={{ backgroundColor: "#c8c8c8" }} />
                    <div className="h-[18%] w-[38%] rounded-[1px]" style={{ backgroundColor: "#dcdcdc" }} />
                </div>
                {/* Bullet lines */}
                <div className="flex-1 flex flex-col px-[8%] py-[6%] gap-[10%]">
                    {[78, 62, 70].map((w, i) => (
                        <div
                            key={i}
                            className="h-[15%] rounded-[1px]"
                            style={{ backgroundColor: "#e4e4e4", width: `${w}%` }}
                        />
                    ))}
                </div>
            </div>
            {/* Mini slide strip */}
            <div className="absolute top-[6px] right-[6px] flex flex-col gap-[3px]">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-[20px] h-[14px] rounded-[1px]"
                        style={{ backgroundColor: i === 0 ? "#e0e0e0" : "#ececec" }}
                    />
                ))}
            </div>
        </div>
    );
}

/** Document page skeleton — used for doc and as the default fallback. */
function WordDocSkeleton() {
    return (
        <div className="relative size-full flex justify-center overflow-hidden" style={{ backgroundColor: "#f0f0f0" }}>
            <div
                className="mt-[8px] w-[72%] flex flex-col px-[10%] py-[6%] gap-[5%] rounded-t-[2px]"
                style={{
                    backgroundColor: "#ffffff",
                    minHeight: "90%",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
                }}
            >
                {/* Title */}
                <div
                    className="h-[5%] min-h-[4px] w-[55%] rounded-[1px] mb-[2%]"
                    style={{ backgroundColor: "#c0c0c0" }}
                />
                {/* Text lines */}
                {[95, 88, 92, 80, 90, 85, 78, 92, 70].map((w, i) => (
                    <div
                        key={i}
                        className="h-[4%] min-h-[3px] rounded-[1px]"
                        style={{ backgroundColor: "#dedede", width: `${w}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

/** Plain-text skeleton — reuses the doc page layout. */
function TextSkeleton() {
    return <WordDocSkeleton />;
}

/** Browser-chrome + page layout skeleton — used for html/htm. */
function HtmlSkeleton() {
    return (
        <div className="relative size-full flex flex-col overflow-hidden bg-white">
            {/* Browser chrome bar */}
            <div
                className="shrink-0 h-[15%] flex items-center px-[6%]"
                style={{ backgroundColor: "#ebebeb", gap: "4%" }}
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="rounded-full"
                        style={{ backgroundColor: "#cccccc", width: 7, height: 7, flexShrink: 0 }}
                    />
                ))}
                <div
                    className="flex-1 h-[38%] rounded-[2px] ml-[2%]"
                    style={{ backgroundColor: "#ffffff" }}
                />
            </div>
            {/* Page content */}
            <div className="flex-1 flex flex-col overflow-hidden px-[8%] py-[5%]" style={{ gap: "6%" }}>
                {/* Hero banner */}
                <div className="shrink-0 h-[28%] w-full rounded-[2px]" style={{ backgroundColor: "#e8e8e8" }} />
                {/* Text lines */}
                {[68, 88, 58].map((w, i) => (
                    <div
                        key={i}
                        className="shrink-0 rounded-[1px]"
                        style={{ backgroundColor: "#d8d8d8", height: "9%", minHeight: 3, width: `${w}%` }}
                    />
                ))}
                {/* Two-column blocks */}
                <div className="flex flex-1 overflow-hidden" style={{ gap: "6%" }}>
                    <div className="flex-1 rounded-[2px]" style={{ backgroundColor: "#eeeeee" }} />
                    <div className="flex-1 rounded-[2px]" style={{ backgroundColor: "#eeeeee" }} />
                </div>
            </div>
        </div>
    );
}

/** Picks the best skeleton for a known file extension; falls back to a generic doc layout. */
export function FileTypeSkeleton({ ext }: { ext?: string }) {
    switch (ext) {
        case "xlsx":
        case "xls":
        case "csv":
            return <ExcelSkeleton />;
        case "pptx":
        case "ppt":
            return <PowerPointSkeleton />;
        case "doc":
            return <WordDocSkeleton />;
        case "txt":
            return <TextSkeleton />;
        case "html":
        case "htm":
            return <HtmlSkeleton />;
        default:
            return <WordDocSkeleton />;
    }
}
