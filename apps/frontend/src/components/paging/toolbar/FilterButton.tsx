// Creates a button used to apply filtering on entries

import {Button} from "@/elements/buttons/button.tsx";
import {FunnelSimpleIcon} from "@phosphor-icons/react";
import * as React from "react";
import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import FilterForm, {type FilterFormProps} from "@/components/forms/FilterForm.tsx";
import {type FormState} from "@/components/forms/Form.tsx";


export type FilterButtonProps<T> = FilterFormProps<T>
export default function FilterButton<T extends object>({
                                                           state,
                                                           ...props
}: FilterButtonProps<T>) {
    const [filterOpen, setFilterOpen] = useState(false)

    const formState: FormState = {
        ...state,
        onCancel: () => {
            // Makes it so on cancel, the window closes
            setFilterOpen(false);
            if (state.onCancel) {
                state.onCancel()
            }
        }
    }

    return (
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger>
                <Button variant={"outline"}>
                    <FunnelSimpleIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-80">
                <h2>Filter Search</h2>
                <FilterForm
                    {...props}
                    state={formState}
                />
            </DialogContent>
        </Dialog>
    )
}