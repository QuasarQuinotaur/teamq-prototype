// Hook that returns entries queried with searching and optional mapper

import {useCallback, useMemo} from "react";
import Fuse from "fuse.js";
import type {CardEntry} from "@/components/cards/Card.tsx";


type QueryEntriesProps = {
    entries: CardEntry[];
    searchPhrase: string;
    mapEntries?: (entries: CardEntry[]) => CardEntry[];
}
export default function useQueryEntries({
                                               entries,
                                               searchPhrase,
                                               mapEntries
}: QueryEntriesProps) {
    const searchFuse = useMemo(() => {
        return new Fuse(entries, {
            keys: ["title"],
            useExtendedSearch: true,
            // useTokenSearch: true,
        })
    }, [entries])
    const getSearchedEntries = useCallback(() => {
        return searchFuse.search(searchPhrase).map(entry => entry.item)
    }, [searchFuse, searchPhrase])

    const searchedEntries = getSearchedEntries()
    return (
        mapEntries ? mapEntries(searchedEntries) : searchedEntries
    )
}