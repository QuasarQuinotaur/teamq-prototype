// Hook that returns entries queried with searching and optional mapper

import {useCallback, useMemo} from "react";
import Fuse from "fuse.js";
import type {CardEntry} from "@/components/cards/Card.tsx";

export type QuerySortFunction = (from: CardEntry[]) => CardEntry[]
export type QueryEntriesProps = {
    entries: CardEntry[];
    searchPhrase: string;
}
type UseQueryEntriesProps = {
    mapEntries?: (entries: CardEntry[]) => CardEntry[];
} & QueryEntriesProps
export default function useQueryEntries({
                                            entries,
                                            searchPhrase,
                                            mapEntries
}: UseQueryEntriesProps) {
    const toSearchEntries = entries

    const searchFuse = useMemo(() => {
        return new Fuse(toSearchEntries, {
            keys: ["title"],
            useExtendedSearch: true,
            threshold: 0.33,
        })
    }, [toSearchEntries])
    const getSearchedEntries = useCallback(() => {
        return searchFuse.search(searchPhrase).map(entry => entry.item)
    }, [searchFuse, searchPhrase])

    const searchedEntries = getSearchedEntries()
    return (
        mapEntries ? mapEntries(searchedEntries) : searchedEntries
    )
}