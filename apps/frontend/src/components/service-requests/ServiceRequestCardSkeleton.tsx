import {
  SERVICE_REQUEST_CARD_STAGE_DOT_HIT_CLASS,
  SERVICE_REQUEST_CARD_STAGE_DOT_INNER_CLASS,
} from "@/components/service-requests/ServiceRequests.tsx";
import { AvatarGroup } from "@/elements/avatar.tsx";
import { Skeleton } from "@/elements/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

/** Line box matching collapsed title: `text-lg` × `leading-tight` (1.125rem × 1.25). */
const TITLE_LINE_BOX_CLASS = "h-[1.40625rem] min-h-[1.40625rem]";

export function ServiceRequestCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "select-none overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex min-h-[3.75rem] flex-col gap-2 py-2">
        <div className="flex min-h-14 items-center gap-2 pr-2">
          <div className="flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-2 pl-3">
            <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3">
              <span
                className={SERVICE_REQUEST_CARD_STAGE_DOT_HIT_CLASS}
                aria-hidden
              >
                <Skeleton
                  className={cn(
                    "flex shrink-0 items-center justify-center border-muted-foreground/50",
                    SERVICE_REQUEST_CARD_STAGE_DOT_INNER_CLASS,
                  )}
                  aria-hidden
                />
              </span>
              <div className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-md bg-background px-2 py-0">
                <Skeleton
                  className={cn(
                    TITLE_LINE_BOX_CLASS,
                    "min-w-0 flex-1 rounded-[min(var(--radius-md),10px)]",
                  )}
                  aria-hidden
                />
                <AvatarGroup className="shrink-0">
                  <Skeleton
                    data-slot="avatar"
                    className="size-6 shrink-0 rounded-full"
                    aria-hidden
                  />
                  <Skeleton
                    data-slot="avatar"
                    className="size-6 shrink-0 rounded-full"
                    aria-hidden
                  />
                </AvatarGroup>
              </div>
            </div>
          </div>

          <div className="flex min-h-14 shrink-0 items-center self-center">
            <Skeleton
              className="size-7 shrink-0 rounded-[min(var(--radius-md),12px)]"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
