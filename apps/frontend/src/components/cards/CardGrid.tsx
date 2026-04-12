// Shows a bunch of information using cards in a grid
// The type of card needs to be specified with renderCard

import * as React from "react";

import type {
    CardState
} from "@/components/cards/Card.tsx";
import type {EntryProps} from "@/components/paging/EntryPage.tsx";

export type CardGridProps = {
    renderCard: (state: CardState) => React.ReactNode;
    defaultBadge?: string;
}
export default function CardGrid({
                                     renderCard,
                                     defaultBadge,
                                     entries,
                                     createOptionsElement
}: CardGridProps & EntryProps) {
    return (
        <div className="grid auto-rows-min gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-10">
            {entries.map((entry) => {
                const entryOptionsWrapper = createOptionsElement ? (
                    (trigger: React.ReactNode) => createOptionsElement(entry, trigger)
                ) : undefined;
                const cardState: CardState = {
                    entry: entry,
                    badges: defaultBadge ? [defaultBadge] : [],
                    createOptionsElement: entryOptionsWrapper,
                }
                return renderCard(cardState);
            })}
        </div>
    )
}