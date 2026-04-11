// Filter view for only searched-for items
// Uses fuse.js for fuzzy finding

import * as React from "react";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/elements/input-group.tsx";
import {
    FILTER_KEY_SEARCH
} from "@/components/paging/EntryPage.tsx";
import {
    MagnifyingGlassIcon
} from "@phosphor-icons/react";
import type {
    CardEntry
} from "@/components/cards/Card.tsx";

// Removes case sensitivity or whitespace from affecting search
function formatSearchPhrase(phrase: string): string {
    return phrase.toLowerCase().replace(/\s+/g, "");
}

// Returns method to filter entry searches using the phrase
function getSearchFilter(phrase: string) {
    const formattedPhrase = formatSearchPhrase(phrase);

    // Search currently only works using title substring
    return (
        (entry: CardEntry): boolean => {
            return formatSearchPhrase(entry.title).includes(formattedPhrase);
        }
    )
}

type SearchBarProps = {
    // setSearchFilter
    setWhitelistFilter: (key: string, filter: (entry: CardEntry) => boolean) => void;
}
export default function SearchBar({
                                      setWhitelistFilter
                                  }: SearchBarProps) {
    function setFilter(phrase: string) {
        setWhitelistFilter(
            FILTER_KEY_SEARCH,
            phrase ? getSearchFilter(phrase) : undefined
        );
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