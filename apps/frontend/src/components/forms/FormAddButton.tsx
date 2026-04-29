// This button shows an "Add Form" window on click

import * as React from "react";

import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";
import {PlusIcon} from "@phosphor-icons/react";
import type {FormState} from "@/components/forms/Form.tsx";
import {FormOfType, type FormOfTypeProps, type FormType} from "@/components/forms/FormOfType.tsx";

const ADD_FORM_HEADERS: { [P in FormType]: string } = {
    Document: "Add Document",
    Employee: "Add Employee",
};

const ADD_FORM_HELP: { [P in FormType]: React.ReactNode } = {
    Document:
        "Upload a file and fill in metadata to register a new document. Submit saves it to the library.",
    Employee:
        "Create a new employee record. Required fields and permissions depend on your organization setup.",
};

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
            onOpenChange={(open) => {
                setFormOpen(open);
                state.onTutorialDialogOpenChange?.(open);
            }}
        >
            <DialogTrigger asChild>
                <Button
                    variant={specialFormText ? "default" : "outline"}
                    className={
                        specialFormText
                            ? "px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            : undefined
                    }
                    id="tutorial-2"
                >
                    {specialFormText ?? <PlusIcon />}
                </Button>
            </DialogTrigger>
            <DialogContent className={"sm:max-w-lg"}>
                <div className="flex items-center gap-2">
                    <h2 className="m-0 border-b-0 pb-0 text-base font-semibold leading-none">
                        {ADD_FORM_HEADERS[formType]}
                    </h2>
                    <HelpHint contentClassName="max-w-sm">{ADD_FORM_HELP[formType]}</HelpHint>
                </div>
                <FormOfType
                    formType={formType}
                    {...formState}
                />
            </DialogContent>
        </Dialog>
    )
}