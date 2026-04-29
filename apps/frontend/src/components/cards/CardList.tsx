// Shows a bunch of information using cards in a list

import * as React from "react"
import { createColumns } from "./list-view-table/columns.tsx"
import { DataTable } from "./list-view-table/data-table.tsx"
import type { CardEntry } from "@/components/cards/Card.tsx"
import type {EntryProps} from "@/components/paging/EntryPage.tsx";
export type CardListProps = {
    onRowClick?: (entry: CardEntry) => void;
}

type CardListOwnProps = CardListProps & EntryProps

export default function CardList({
                                     entries,
                                     createOptionsElement,
                                     onRowClick,
                                     listColumnOptions,
                                     selectMode,
                                     isEntrySelected,
                                     onDocumentRowContextMenu,
                                     tutorialHighlightEntryId,
}: CardListOwnProps) {
    const columns = createColumns(createOptionsElement, listColumnOptions);

    return (
        <div className="container mx-auto py-4 px-4">
            <DataTable
                columns={columns}
                data={entries ?? []}
                onRowClick={onRowClick}
                selectMode={selectMode}
                isRowSelected={isEntrySelected}
                onDocumentRowContextMenu={onDocumentRowContextMenu}
                tutorialHighlightEntryId={tutorialHighlightEntryId}
            />
        </div>
    )
}
