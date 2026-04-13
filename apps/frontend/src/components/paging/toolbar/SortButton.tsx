// Creates a button used to apply sorting

import {Popover, PopoverContent, PopoverTrigger} from "@/elements/buttons/popover.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {ArrowsDownUpIcon} from "@phosphor-icons/react";
import * as React from "react";
import {useState} from "react";
import SortForm, {type SortFormProps} from "@/components/forms/SortForm.tsx";

export type SortButtonProps = SortFormProps
export default function SortButton(props: SortButtonProps) {
    const [sortOpen, setSortOpen] = useState(false)
    return (
        <Popover
            open={sortOpen}
            onOpenChange={setSortOpen}
        >
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <ArrowsDownUpIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                {/*<h4>Sort</h4>*/}
                <SortForm
                    {...props}
                />
            </PopoverContent>
        </Popover>
    )
}