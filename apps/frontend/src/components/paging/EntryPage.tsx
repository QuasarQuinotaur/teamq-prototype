// Component encompassing the part of a page displaying entries
// Can search, filter, and sort through all entries
// Can switch between list/grid view

import {useState} from "react";
import * as React from "react";

import Toolbar, {type ViewType} from "@/components/paging/Toolbar.tsx";
import Pagination from "@/components/paging/Pagination.tsx";
import {type CardEntry} from "@/components/cards/Card.tsx";
import CardGrid, {type CardGridProps} from "@/components/cards/CardGrid.tsx";
import CardList, {type CardListProps} from "@/components/cards/CardList.tsx";


export type EntryProps = {
    entries: CardEntry[];
    createOptionsElement?: (entry: CardEntry, trigger: React.ReactNode) => React.ReactNode;
}

type EntryPageProps = {
    cardGridProps: CardGridProps;
    cardListProps?: CardListProps;
    // These elements get added to top right toolbar
    extraToolbarElements?: React.ReactNode[];
}
export default function EntryPage({
                                      cardListProps,
                                      cardGridProps,
                                      extraToolbarElements,
                                      ...entryProps
}: EntryPageProps & EntryProps) {
    // for view type (grid vs. list)
    const [view, setView] = useState<ViewType>("Grid");

    const { entries } = entryProps;

    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid

    return (
        <>
            {/*Toolbar for querying*/}
            <Toolbar
                view={view}
                setView={setView}
                extraElements={extraToolbarElements}
            />
            {view === "Grid" ?
                (
                    <CardGrid
                        {...cardGridProps}
                        {...entryProps}
                    />
                ) :
                (
                    <CardList
                        {...cardListProps}
                        {...entryProps}
                    />
                )}
            <div>
                <Pagination docNum={entries.length}/>
            </div>
        </>
    )
}