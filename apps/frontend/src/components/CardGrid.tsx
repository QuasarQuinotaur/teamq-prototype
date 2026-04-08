import * as React from "react";

import Card from "@/components/Card.tsx"
import type {CardEntry} from "@/components/Card.tsx";

type CardGridProps = {
    entries: CardEntry[];
    entryOptionsWrapper?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode
    defaultBadge: string;
}
function CardGrid({
                      entries,
                      entryOptionsWrapper,
                      defaultBadge,
}: CardGridProps) {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {entries.map((entry) => (
                <Card
                    entry={entry}
                    badges={[defaultBadge]}
                    action="View"
                    optionsWrapper={entryOptionsWrapper ? (
                        (trigger) => (
                            entryOptionsWrapper(entry, trigger)
                        )
                    ) : undefined}
                />
            ))}
        </div>
    )
}

export {
    CardGrid
}