// Filter view for only searched-for items
// Uses fuse.js for fuzzy finding

import * as React from "react";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/elements/input-group.tsx";
import {
    FILTER_KEY_SEARCH,
} from "@/components/paging/EntryPage.tsx";
import {
    MagnifyingGlassIcon
} from "@phosphor-icons/react";
import type {FuseFilter} from "@/components/paging/entry-page-query.tsx";


export type SearchBarProps = {
    // Uses fuse to filter array of card entries to include
    setFuseFilter: (key: string, filter: FuseFilter | undefined) => void
}
export default function SearchBar({
                                      setFuseFilter
}: SearchBarProps) {
    function setFilter(phrase: string) {
        setFuseFilter(
            FILTER_KEY_SEARCH,
            phrase ? (
                (fuse) =>
                    fuse.search(phrase).map(result => result.item)
            ) : undefined
        )
    }

    return (
        <InputGroup>
            <InputGroupInput
                placeholder={"Search..."}
                onChange={(e) => setFilter(e.target.value)}
            />
            <InputGroupAddon align={"inline-end"}>
                <MagnifyingGlassIcon/>
            </InputGroupAddon>
        </InputGroup>
    )
}