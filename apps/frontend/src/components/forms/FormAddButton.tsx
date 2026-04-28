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

    const specialFormText = (
        formType === "Document" ? "+ New Document" :
        formType === "Employee" ? "+ New Employee" :
        null
    )

    return (
        <Dialog
            open={formOpen}
            onOpenChange={setFormOpen}
        >
            <DialogTrigger asChild>
                <Button
                    variant={specialFormText ? "default" : "outline"}
                    className={
                        specialFormText
                            ? "px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            : undefined
                    }
                >
                    {specialFormText ?? <PlusIcon />}
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