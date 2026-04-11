// Creates a button used to apply filtering

import {Popover, PopoverContent, PopoverTrigger} from "@/elements/buttons/popover.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {FunnelSimpleIcon} from "@phosphor-icons/react";
import * as React from "react";
import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";

export default function FilterButton() {
    const [filterOpen, setFilterOpen] = useState(false);

    return (
        <Dialog>
            <DialogTrigger>
                <Button variant={"outline"}>
                    <FunnelSimpleIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-80">
                <h2>Filter Search</h2>
                <p>hi</p>
            </DialogContent>
        </Dialog>
    )
}