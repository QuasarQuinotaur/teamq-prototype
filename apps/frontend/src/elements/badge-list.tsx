import {Badge} from "@/elements/badge.tsx";
import * as React from "react";


type BadgeListProps = {
    badges: string[]
}
export default function BadgeList({
                                      badges
}: BadgeListProps) {
    return (
        <>
            {badges.filter((b) => b != null && b !== "").map((badgeString) => (
                <Badge variant="secondary">
                    {badgeString}
                </Badge>
            ))}
        </>
    )
}