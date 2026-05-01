import { cn } from "@/lib/utils.ts";

export type EmptyResultsStateProps = {
    title: string;
    description?: string;
    className?: string;
};

/** Dashed bordered empty state; matches the admin check-in “no results” treatment. */
export function EmptyResultsState({ title, description, className }: EmptyResultsStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center",
                className,
            )}
        >
            <p className="text-sm font-medium">{title}</p>
            {description ? (
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
            ) : null}
        </div>
    );
}
