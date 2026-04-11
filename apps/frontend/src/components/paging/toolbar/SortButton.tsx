// Creates a button used to apply sorting

import {Popover, PopoverContent, PopoverTrigger} from "@/elements/buttons/popover.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {ArrowsDownUpIcon} from "@phosphor-icons/react";
import * as React from "react";

export default function SortButton() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <ArrowsDownUpIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div>
                    <p>Sort Example</p>
                </div>
            </PopoverContent>
        </Popover>
    )
}