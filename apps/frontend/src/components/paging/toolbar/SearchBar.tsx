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
import { cn } from "@/lib/utils.ts";


export type SearchBarProps = {
    setFilter: (phrase: string) => void;
    className?: string;
    id?: string;
}
export default function SearchBar({
                                      setFilter,
                                      className,
                                      id,
}: SearchBarProps) {
    return (
        <InputGroup id={id} className={cn("bg-background", className)}>
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