import type {Tag} from "db";
import {TagIcon} from "@phosphor-icons/react";
import {cn} from "@/lib/utils.ts";

type TagElementProps = {
    tag: Tag,
    tagFilled?: boolean,
    noWrap?: boolean,
    addExtraPadding?: boolean,
}
export default function TagElement({
                                       tag,
                                       tagFilled,
                                       noWrap,
                                       addExtraPadding
}: TagElementProps) {
    return (
        <div className={"justify-start justify-self-start flex flex-nowrap items-center gap-2"}>
            <TagIcon
                color={tag.color}
                weight={tagFilled ? "fill" : "duotone"}
            />
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