// Creates a button used to apply filtering on entries

import {Button} from "@/elements/buttons/button.tsx";
import {FunnelSimpleIcon} from "@phosphor-icons/react";
import * as React from "react";
import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import FilterForm, {type FilterFormProps} from "@/components/forms/FilterForm.tsx";
import {type FormState} from "@/components/forms/Form.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/elements/buttons/popover.tsx";


export type FilterButtonProps<T> = FilterFormProps<T> & { triggerId?: string }
export default function FilterButton<T extends object>({
    triggerId,
    ...props
}: FilterButtonProps<T>) {
    const [filterOpen, setFilterOpen] = useState(false)

    return (
        <Popover
            open={filterOpen}
            onOpenChange={setFilterOpen}
        >
            <PopoverTrigger>
                <Button variant={"outline"} id={triggerId}>
                    <FunnelSimpleIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align={"end"} className="w-80">
                {/*<h4>Filter</h4>*/}
                <FilterForm
                    {...props}
                />
            </PopoverContent>
        </Popover>
    )
}