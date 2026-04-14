// This button shows an "Add Form" window on click

import * as React from "react";

import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {PlusIcon} from "@phosphor-icons/react";
import type {FormState} from "@/components/forms/Form.tsx";
import {FormOfType, type FormOfTypeProps, type FormType} from "@/components/forms/FormOfType.tsx";

const ADD_FORM_HEADERS: {[P in FormType]: string} = {
    Document: "Add Document",
    Employee: "Add Employee"
}

export default function FormAddButton({
                                          formType,
                                          ...state
}: FormOfTypeProps) {
    const [formOpen, setFormOpen] = useState(false);

    const formState: FormState = {
        ...state,
        onCancel: () => {
            // Makes it so on cancel, the window closes
            setFormOpen(false);
            if (state.onCancel) {
                state.onCancel()
            }
        }
    }

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
                <h2>{ADD_FORM_HEADERS[formType]}</h2>
                <FormOfType
                    formType={formType}
                    {...formState}
                />
            </DialogContent>
        </Dialog>
    )
}