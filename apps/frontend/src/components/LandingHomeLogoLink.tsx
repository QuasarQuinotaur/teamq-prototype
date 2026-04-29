import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Top-left Hanover mark (same asset as the hero; rendered black via `brightness-0`) linking to `/`.
 */
export function LandingHomeLogoLink({ className }: { className?: string }) {
    return (
        <Link
            to="/"
            className={cn(
                "fixed left-4 top-4 z-40 select-none rounded-lg p-1.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className,
            )}
            aria-label="Back to home"
        >
            <img
                src="/CombinationMark.png"
                alt=""
                className="pointer-events-none h-10 w-auto brightness-0 md:h-12"
            />
        </Link>
    );
}
