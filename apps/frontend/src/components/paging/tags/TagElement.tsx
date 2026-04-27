import type {Tag} from "db";
import {Globe, TagIcon} from "@phosphor-icons/react";
import {cn} from "@/lib/utils.ts";

type TagElementProps = {
    tag: Tag,
    tagFilled?: boolean,
    noWrap?: boolean,
    addExtraPadding?: boolean,
    /** When false, the global (globe) icon is not rendered (e.g. when shown elsewhere in the row). */
    showGlobalIcon?: boolean,
}
export default function TagElement({
                                       tag,
                                       tagFilled,
                                       noWrap,
                                       addExtraPadding,
                                       showGlobalIcon = true,
}: TagElementProps) {
    return (
        <div className={"min-w-0 justify-start justify-self-start flex flex-nowrap items-center gap-2"}>
            <TagIcon
                color={tag.color}
                weight={tagFilled ? "fill" : "duotone"}
            />
            {showGlobalIcon && tag.isGlobal && (
                <span title="Global tag (visible to everyone)" className="inline-flex shrink-0 text-muted-foreground" aria-label="Global tag">
                    <Globe className="size-4" weight="duotone" />
                </span>
            )}
            <p
                className={cn(
                    "max-w-60 truncate",
                    !noWrap && "hover:whitespace-normal hover:overflow-visible hover:wrap-break-word pr-3",
                    addExtraPadding && "pr-9"
                )}
            >
                {tag.tagName}
            </p>
        </div>
    )
}