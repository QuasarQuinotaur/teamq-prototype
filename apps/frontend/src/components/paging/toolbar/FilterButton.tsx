// Creates a button used to apply filtering

import {Button} from "@/elements/buttons/button.tsx";
import {FunnelSimpleIcon} from "@phosphor-icons/react";
import * as React from "react";
import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import Form from "@/components/forms/Form.tsx";
import type {WhitelistFilter, WhitelistFilters} from "@/components/paging/EntryPage.tsx";


export type FilterButtonProps = {
    whitelistFilters: WhitelistFilters;
    setWhitelistFilter: (key: string, filter: WhitelistFilter) => void;
}
export default function FilterButton() {
    const [filterOpen, setFilterOpen] = useState(false)

    return (
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger>
                <Button variant={"outline"}>
                    <FunnelSimpleIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-80">
                <h2>Filter Search</h2>
            </DialogContent>
        </Dialog>
    )
}