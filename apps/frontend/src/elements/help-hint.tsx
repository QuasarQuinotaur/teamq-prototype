import * as React from "react"

import { cn } from "@/lib/utils.ts"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/elements/tooltip.tsx"

type HelpHintProps = {
  children: React.ReactNode
  className?: string
  /** Passed to the tooltip panel */
  contentClassName?: string
} & Pick<React.ComponentProps<typeof TooltipContent>, "side" | "sideOffset">

function HelpHint({
  children,
  className,
  contentClassName,
  side = "top",
  sideOffset = 6,
}: HelpHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          // Not in tab order: Radix Dialog focuses the first tabbable node on open; a
          // focusable Help control would open this tooltip immediately. Hover still works.
          tabIndex={-1}
          className={cn(
            "inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full border border-muted-foreground/35 bg-background text-[10px] font-semibold leading-none text-muted-foreground transition-colors hover:border-muted-foreground/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className
          )}
          aria-label="Help"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset} className={contentClassName}>
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

export { HelpHint }
