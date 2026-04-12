// Hook for entry page filtering, which also returns properties to use for filtering elements

import {useCallback, useEffect, useMemo, useState} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {SearchBarProps} from "@/components/paging/toolbar/SearchBar.tsx";
import type {FilterButtonProps} from "@/components/paging/toolbar/FilterButton.tsx";
import * as React from "react";
import {handleKeyChangeOrDelete} from "@/lib/utils.ts";
import Fuse from "fuse.js";
import type {CreateFieldsElement} from "@/components/forms/Form.tsx";


export type FuseFilter = (fuse: Fuse<CardEntry>) => CardEntry[]
export type FuseFilters = {[key: string]: FuseFilter}
export type KeyFilters<T> = {[TKey in keyof T]?: (T[TKey])[]}
export type WhitelistFilter = (entry: CardEntry) => boolean
export type WhitelistFilters = {[key: string]: WhitelistFilter}
export type UseFilterProps<T> = {
    searchBarProps: SearchBarProps,
    filterButtonProps: FilterButtonProps<T>,
    sortButtonProps: object
}
export type FilterOptions<T> = {
    initWhitelistFilters?: WhitelistFilters;
    initFieldFilters?: T;
    createFieldsElement?: CreateFieldsElement<T>;
}


function passesFieldFilters<T extends KeyFilters<object>>(entry: CardEntry, fieldFilters: T): boolean {
    // Has all required keys if not missing any key
    const item = entry.item
    const missingAnyKey =
        Object.entries(fieldFilters).some(([key, list]: [string, never[]]) => {
            return !list.some((value) => item[key] === value)
        })
    return !missingAnyKey
}

function passesWhitelistFilters(entry: CardEntry, whitelistFilters: WhitelistFilters): boolean {
    // Only include entries in whitelist
    const notInWhitelist =
        Object.values(whitelistFilters).some((filter) => {
            return !filter(entry)
        })
    return !notInWhitelist;
}


// export type Filter
type EntryPageFilterProps<T> = {
    entries: CardEntry[];
    setFilterEntries: React.Dispatch<React.SetStateAction<CardEntry[]>>;
} & FilterOptions<T>
export default function useEntryPageFilter<T extends KeyFilters<object>>({
                                                  entries, 
                                                  setFilterEntries,
                                                  initWhitelistFilters,
                                                  initFieldFilters,
                                                  createFieldsElement,
}: EntryPageFilterProps<T>): UseFilterProps<T> {
    // Store key filters where items need matching keys
    const [fieldFilters, setFieldFilters] = useState<T>(initFieldFilters ?? ({} as T))
    // function setKeyFilter(key: string, keyFilter: KeyFilters<T> | undefined) {
    //     // handleKeyChangeOrDelete(
    //     //     keyFilter,
    //     //     setKeyFilters,
    //     //     key,
    //     //     keyFilter
    //     // )
    // }
    
    // Store many different whitelist filters from multiple sources
    const [whitelistFilters, setWhitelistFilters] = useState(initWhitelistFilters ?? {})
    function setWhitelistFilter(key: string, whitelistFilter: WhitelistFilter | undefined) {
        handleKeyChangeOrDelete(
            whitelistFilters,
            setWhitelistFilters,
            key,
            whitelistFilter
        )
    }

    // Filter array using fuse fuzzy search
    const fuse = useMemo(() => {
        return new Fuse(entries, {
            keys: ["title"],
            useExtendedSearch: true,
            // useTokenSearch: true,
        })
    }, [entries])
    const [fuseFilters, setFuseFilters] = useState<FuseFilters>({})
    function setFuseFilter(key: string, fuseFilter: FuseFilter | undefined) {
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
        return fuseFiltered
            .filter((entry) => passesFieldFilters(entry, fieldFilters))
            .filter((entry: CardEntry) => passesWhitelistFilters(entry, whitelistFilters));
    }, [entries, fuse, fuseFilters, fieldFilters, whitelistFilters]);
    useEffect(() => {
        setFilterEntries(getFilteredEntries)
    }, [setFilterEntries, getFilteredEntries]);

    // Create use props
    const searchBarProps: SearchBarProps = {
        setFuseFilter
    }
    const filterButtonProps: FilterButtonProps<T> = {
        fieldFilters,
        createFieldsElement
    }
    const sortButtonProps = {}
    return {
        searchBarProps,
        filterButtonProps,
        sortButtonProps
    }
}