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
    const [pageEntries, setPageEntries] = useState<CardEntry[]>()
    const entriesPerPage = 10;

    const { entries } = entryProps;
    const pagedEntries: EntryProps = { entries: pageEntries, createOptionsElement: entryProps.createOptionsElement }

    React.useEffect(() => {setPageEntries(entries.slice(0, 10))}, [entries]);

    // TODO note/bug: if u switch to list, visit another paging and come back, it will be back to grid

    const pageCallback = (pageNum: number)=> {
        const first = entriesPerPage*(pageNum-1)
        const last = entriesPerPage*(pageNum)
        setPageEntries(entries.slice(first, last))
    }



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
                    <>
                        <CardList
                            {...pageEntries}
                            {...pagedEntries}
                        />
                        <div>
                            <Pagination docNum={entries.length} entriesCallback={pageCallback} />
                        </div>
                    </>
                )}

        </>
    )
}