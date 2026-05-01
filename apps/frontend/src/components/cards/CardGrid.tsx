// Shows a bunch of information using cards in a grid
// The type of card needs to be specified with renderCard

import * as React from "react";

import type {
    CardEntry,
    CardState
} from "@/components/cards/Card.tsx";
import type {EntryProps} from "@/components/paging/EntryPage.tsx";
import { ThumbnailBatchProvider } from "@/components/cards/ThumbnailBatchContext.tsx";
import { cn } from "@/lib/utils.ts";

/** Min track ~0.7× the prior 22rem (~15.4rem →15.5rem); `min(100%,…)` keeps one column on narrow viewports. */
export const CARD_GRID_LAYOUT_CLASS =
    "grid auto-rows-min gap-6 px-10 grid-cols-[repeat(auto-fill,minmax(min(100%,15.5rem),1fr))]";

export type CardGridProps = {
    renderCard: (state: CardState) => React.ReactNode;
    defaultBadge?: string;
    isLoading?: boolean;
    /** When set with lengths summing to `entries.length`, thumbnails reveal per chunk (nested providers). */
    thumbnailChunkSizes?: number[];
}
export default function CardGrid({
                                     renderCard,
                                     defaultBadge,
                                     isLoading,
                                     entries,
                                     createOptionsElement,
                                     selectMode,
                                     isEntrySelected,
                                     onToggleEntrySelect,
                                     thumbnailChunkSizes,
}: CardGridProps & EntryProps) {
    if (!isLoading && entries.length === 0) {
        return (
            <div className={CARD_GRID_LAYOUT_CLASS}>
                No results found.
            </div>
        )
    }

    function renderEntry(entry: CardEntry) {
        const entryOptionsWrapper = createOptionsElement ? (
            (trigger: React.ReactNode) => createOptionsElement(entry, trigger)
        ) : undefined;
        const cardState: CardState = {
            entry: entry,
            badges: defaultBadge ? [defaultBadge] : [],
            createOptionsElement: entryOptionsWrapper,
            selectMode,
            selected: isEntrySelected?.(entry) ?? false,
            onSelectToggle: onToggleEntrySelect
                ? () => {
                      onToggleEntrySelect(entry);
                  }
                : undefined,
        }
        return (
            <div
                key={entry.item.id}
                data-marquee-entry-id={entry.item.id}
                className={cn(
                    "min-w-0",
                    selectMode && "select-none",
                )}
                onDragStartCapture={
                    selectMode ? (e) => e.preventDefault() : undefined
                }
            >
                {renderCard(cardState)}
            </div>
        );
    }

    const chunkSum =
        thumbnailChunkSizes?.reduce((acc, n) => acc + n, 0) ?? 0;
    const useChunkedThumbnails =
        Boolean(thumbnailChunkSizes?.length) &&
        chunkSum === entries.length;

    if (useChunkedThumbnails && thumbnailChunkSizes) {
        let offset = 0;
        return (
            <div className={CARD_GRID_LAYOUT_CLASS}>
                {thumbnailChunkSizes.map((sz, ci) => {
                    const chunk = entries.slice(offset, offset + sz);
                    offset += sz;
                    const ids = chunk.map((e) => e.item.id);
                    return (
                        <ThumbnailBatchProvider
                            key={`thumb-chunk-${ci}-${ids[0] ?? ci}`}
                            batchKey={`thumb-chunk-${ci}-${ids.join(",")}`}
                            expectedContentIds={ids}
                        >
                            <React.Fragment>{chunk.map(renderEntry)}</React.Fragment>
                        </ThumbnailBatchProvider>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={CARD_GRID_LAYOUT_CLASS}>
            {entries.map(renderEntry)}
        </div>
    )
}