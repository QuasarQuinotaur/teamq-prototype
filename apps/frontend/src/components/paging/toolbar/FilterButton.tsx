// Creates a button used to apply filtering

import {Popover, PopoverContent, PopoverTrigger} from "@/elements/buttons/popover.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {FunnelSimpleIcon} from "@phosphor-icons/react";
import * as React from "react";

export default function FilterButton() {
    return (
        <Popover>
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <FunnelSimpleIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div>
                    <p>Filter Example</p>
                </div>
            </PopoverContent>
        </Popover>
    )
}