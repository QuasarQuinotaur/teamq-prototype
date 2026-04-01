"use client"

import * as React from "react"

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import {Field, FieldLabel} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput
} from "@/components/ui/input-group.tsx";
import {
    MagnifyingGlassIcon
} from "@phosphor-icons/react";

export default function MinorTopbar() {
    return (
        <NavigationMenu>
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]"/>
            <InputGroup>
                <InputGroupInput
                    id={"minor-topbar-search"}
                    placeholder={"Search..."}
                    // value={name}
                    // onChange={(e) =>
                    //     setName(e.target.value)}
                />
                <InputGroupAddon align={"inline-end"}>
                    <MagnifyingGlassIcon/>
                </InputGroupAddon>
            </InputGroup>
        </NavigationMenu>
    )
}