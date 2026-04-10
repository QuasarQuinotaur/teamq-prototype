// This button shows an "Add Form" window on click

import * as React from "react";

import FormWindow, {type FormWindowProps} from "@/components/forms/FormWindow.tsx";
import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {PlusIcon} from "@phosphor-icons/react";


export default function FormAddButton(windowProps: FormWindowProps) {
    const [formOpen, setFormOpen] = useState(false);

    return (
        <Dialog
            open={formOpen}
            onOpenChange={setFormOpen}
        >
            <DialogTrigger asChild>
                <Button variant={"outline"}>
                    <PlusIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent className={"sm:max-w-lg"}>
                <FormWindow
                    {...windowProps}
                    onCancel={() => {
                        // Makes it so on cancel, the window closes
                        setFormOpen(false);
                        if (windowProps.onCancel) {
                            windowProps.onCancel()
                        }
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}