import {Badge} from "@/elements/badge.tsx";
import * as React from "react";
import {cn, formatHex} from "@/lib/utils.ts";

export type BadgeInfo = {
    node: React.ReactNode;
    color?: BadgeColor | string;
}
type BadgeColor = "red" | "blue"

const BADGE_COLOR_HEX_REFERENCE: {[P in BadgeColor]: string} = {
    red: "ff0000",
    blue: "0000ff",
}

function getBadgeColorStyle(color: BadgeColor | string): React.CSSProperties {
    const hex = formatHex(BADGE_COLOR_HEX_REFERENCE[color] ?? color)
    return {
        color: `color-mix(in srgb, ${hex}, black 30%)`,
        backgroundColor: `color-mix(in oklab, ${hex} 15%, transparent)`,
        borderColor: `color-mix(in srgb, ${hex}, black 20%)`,
    }
}

type BadgeListProps = {
    badges: (string | BadgeInfo)[]
}
export default function BadgeList({
                                      badges
}: BadgeListProps) {
    return (
        <div className={`flex flex-wrap gap-1 max-h-none whitespace-normal overflow-visible text-ellipsis`}>
            {badges.filter((b) => b != null && b !== "").map((badge) => {
                return (
                    <Badge
                        variant="secondary"
                        className={"shrink-0"}
                        style={typeof badge === "object" && badge.color
                            ? getBadgeColorStyle(badge.color) : {}}
                    >
                        {typeof badge === "object" ? badge.node : badge}
                    </Badge>
                )
            })}
        </div>
    )
}