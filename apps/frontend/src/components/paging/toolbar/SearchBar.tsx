// Filter view for only searched-for items

import * as React from "react";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/elements/input-group.tsx"
import {
    MagnifyingGlassIcon
} from "@phosphor-icons/react";


export type SearchBarProps = {
    setFilter: (phrase: string) => void
}
export default function SearchBar({
                                      setFilter
}: SearchBarProps) {
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