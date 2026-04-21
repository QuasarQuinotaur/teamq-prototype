import * as React from "react";
import {useState} from "react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/Collapsible.tsx";
import {cn} from "@/lib/utils.ts";
import {ChevronDownIcon} from "lucide-react";
import {StarIcon} from "@phosphor-icons/react";
import useMainContext from "@/components/auth/hooks/main-context.tsx";


type FavoriteDropdownProps = {
    favoriteCount: number,
    compact?: boolean,
} & React.ComponentProps<typeof CollapsibleContent>
export default function FavoriteDropdown({
                                             favoriteCount,
                                             compact,
                                             ...props
}: FavoriteDropdownProps) {
    const { favoritesOpen, setFavoritesOpen } = useMainContext()

    return (
        <Collapsible
            open={favoritesOpen}
            onOpenChange={setFavoritesOpen}
            className={compact ? "ml-10 mr-10" : "ml-4 mr-4"}
        >
            <div
                className={cn(
                    "select-none overflow-hidden rounded-xl border border-border transition-colors ",
                    favoritesOpen && "ring-1 ring-ring/20",
                )}
            >
                <div className={"flex min-h-14 items-stretch gap-2"}>
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        aria-expanded={favoritesOpen}
                        className={cn(
                            "flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left outline-none",
                            "hover:bg-muted/40",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        )}
                    >
                        <ChevronDownIcon
                            className={cn(
                                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                favoritesOpen && "rotate-180"
                            )}
                            aria-hidden
                        />
                        <span
                            className={"min-w-0 flex-1 truncate font-medium text-foreground"}
                        >
                            <div className={"flex gap-2 align-middle items-center"}>
                                <StarIcon weight={"fill"} offset={5}/>
                                Favorites ({favoriteCount})
                            </div>
                        </span>
                    </button>
                </CollapsibleTrigger>
                </div>
                <CollapsibleContent
                    {...props}
                    className={cn(
                        compact && "p-3",
                        props.className
                    )}
                />
            </div>
        </Collapsible>
    )
}