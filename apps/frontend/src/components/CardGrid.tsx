import * as React from "react";

import Card from "@/components/Card.tsx"
import type {CardEntry} from "@/components/Card.tsx";
import type {Item} from "@/components/forms/Form.tsx";

type CardGridProps<T extends Item> = {
    entries: CardEntry<T>[];
    entryOptionsWrapper?: (entry: CardEntry<T>, trigger: React.ReactNode) => React.ReactNode
    defaultBadge: string;
}
function CardGrid<T extends Item>({
                      entries,
                      entryOptionsWrapper,
                      defaultBadge
}: CardGridProps<T>) {
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