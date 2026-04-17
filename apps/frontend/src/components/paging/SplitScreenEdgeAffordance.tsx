import { PlusIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils.ts";

type SplitScreenEdgeAffordanceProps = {
    onActivate: () => void;
};

/**
 * Fixed right-edge strip: hover reveals a + tab; hovering the button expands to show "Split".
 */
export default function SplitScreenEdgeAffordance({ onActivate }: SplitScreenEdgeAffordanceProps) {
    return (
        <div
            className={cn(
                "pointer-events-none fixed top-(--spacing-navbar-height) right-0 z-30 hidden h-[calc(100dvh-var(--spacing-navbar-height))] w-16 md:block",
            )}
        >
            <div className="group/strip pointer-events-auto absolute top-1/2 right-0 flex h-64 w-20 -translate-y-1/2 items-center justify-end pr-0.5">
                <button
                    type="button"
                    onClick={onActivate}
                    className={cn(
                        "flex h-11 shrink-0 items-center gap-1.5 overflow-hidden rounded-l-full border border-r-0 bg-background py-0 pl-3 shadow-md ring-1 ring-border/50",
                        "max-w-11 translate-x-[60%] opacity-0 transition-[max-width,transform,opacity,box-shadow] duration-500 ease-out",
                        "group-hover/strip:translate-x-0 group-hover/strip:opacity-100",
                        "group-focus-within/strip:translate-x-0 group-focus-within/strip:opacity-100",
                        "hover:max-w-[7.5rem] hover:shadow-lg",
                        "focus-visible:max-w-[7.5rem]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    aria-label="Open split view"
                >
                    <PlusIcon className="size-5 shrink-0" weight="bold" />
                    <span className="shrink-0 whitespace-nowrap pl-2 pr-2 text-md font-medium">Split</span>
                </button>
            </div>
        </div>
    );
}
