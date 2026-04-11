// Hook for entry page filtering, which also returns properties to use for filtering elements

import {useCallback, useEffect, useMemo, useState} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {SearchBarProps} from "@/components/paging/toolbar/SearchBar.tsx";
import type {FilterButtonProps} from "@/components/paging/toolbar/FilterButton.tsx";
import * as React from "react";
import type {FuseFilters, WhitelistFilters} from "@/components/paging/EntryPage.tsx";
import {handleKeyChangeOrDelete} from "@/lib/utils.ts";
import Fuse from "fuse.js";


type UseFilterProps = {
    searchBarProps: SearchBarProps,
    filterButtonProps: FilterButtonProps,
    sortButtonProps: object
}
type EntryPageFilterProps = {
    entries: CardEntry[];
    initWhitelistFilters: WhitelistFilters;
    setFilterEntries: React.Dispatch<React.SetStateAction<CardEntry[]>>;
}
export default function useEntryPageFilter({
                                               entries,
                                               initWhitelistFilters,
                                               setFilterEntries,
}: EntryPageFilterProps): UseFilterProps {
    // Store many different whitelist filters from multiple sources
    const [whitelistFilters, setWhitelistFilters] = useState(initWhitelistFilters ?? {})
    function setWhitelistFilter(key: string, whitelistFilter: ((entry: CardEntry) => boolean) | undefined) {
        handleKeyChangeOrDelete(
            whitelistFilters,
            setWhitelistFilters,
            key,
            whitelistFilter
        )
    }

    // Filter array using fuse fuzzy search
    const [fuseFilters, setFuseFilters] = useState<FuseFilters>({})
    const fuse = useMemo(() => {
        return new Fuse(entries, {
            keys: ["title"],
            useExtendedSearch: true,
            // useTokenSearch: true,
        })
    }, [entries])
    function setFuseFilter(
        key: string,
        fuseFilter: ((fuse: Fuse<CardEntry>) => CardEntry[]) | undefined
    ) {
        handleKeyChangeOrDelete(
            fuseFilters,
            setFuseFilters,
            key,
            fuseFilter
        )
    }

    // Returns all entries filtered
    const getFilteredEntries = useCallback(() => {
        const fuseFilterList = Object.values(fuseFilters)
        const fuseFiltered =
            fuseFilterList.length > 0 ? fuseFilterList.reduce(
                (acc: CardEntry[], filter) => {
                    const resultEntries = filter(fuse);
                    return [
                        ...acc,
                        ...resultEntries
                    ]
                }, []
            ) : entries
        return fuseFiltered.filter((entry: CardEntry): boolean => {
            // Only include entries in whitelist
            const notInWhitelist =
                Object.entries(whitelistFilters).some(([key, filter]) => {
                    return !filter(entry)
                })
            return !notInWhitelist;
        })
    }, [entries, fuse, fuseFilters, whitelistFilters]);
    useEffect(() => {
        setFilterEntries(getFilteredEntries)
    }, [setFilterEntries, getFilteredEntries]);

    // Create use props
    const searchBarProps: SearchBarProps = {
        setFuseFilter
    }
    const filterButtonProps: FilterButtonProps = {
        whitelistFilters,
        setWhitelistFilter
    }
    const sortButtonProps = {}
    return {
        searchBarProps,
        filterButtonProps,
        sortButtonProps
    }
}