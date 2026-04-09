import * as React from "react";

import Card from "@/components/Card.tsx"
import type {CardEntry} from "@/components/Card.tsx";

type CardGridProps = {
    entries: CardEntry[];
    entryOptionsWrapper?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode
    defaultBadge: string;
    renderCard?: (entry: CardEntry, optionsWrapper?: (trigger: React.ReactNode) => React.ReactNode) => React.ReactNode;
    onView?: (entry: CardEntry) => void;
}
function CardGrid({
                      entries,
                      entryOptionsWrapper,
                      defaultBadge,
                      renderCard,
                      onView,
}: CardGridProps) {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {entries.map((entry) => {
                const optionsWrapper = entryOptionsWrapper ? (
                    (trigger: React.ReactNode) => entryOptionsWrapper(entry, trigger)
                ) : undefined;
                if (renderCard) {
                    return renderCard(entry, optionsWrapper);
                }
                return (
                    <Card
                        entry={entry}
                        badges={[defaultBadge]}
                        action="View"
                        optionsWrapper={optionsWrapper}
                        onView={onView}
                    />
                );
            })}
        </div>
    )
}

export {
    CardGrid
}