// import * as React from "react";
import {useState} from "react";

import { DocumentForm } from "@/components/forms/DocumentForm.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/elements/buttons/popover.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import { PlusIcon } from "@phosphor-icons/react";
import {Separator} from "@/elements/separator.tsx";

const DEFAULT_FORM_HEADERS: Record<FormType, string> = {
    Document: "Add Document",
    Employee: "Add Employee"
}

export type FormProps = {
    fromItem?: object;
    isSubmitting?: boolean;
    onCancel?: () => void
}
export type FormType = "Document" | "Employee"


export type FormWindowProps = {
    formType: FormType,
    header?: string,
    headerMargin?: boolean
} & FormProps
function FormWindow({
                        header,
                        headerMargin = true,
                        formType,
                        ...props
}: FormWindowProps) {
    return (
        <>
            <h2 className={headerMargin ? "mb-4" : ""}>{header ?? DEFAULT_FORM_HEADERS[formType]}</h2>
            {(
                // TODO Fix
                formType == "Document" ? (<DocumentForm {...props} />) :
                    formType == "Employee" ? (<DocumentForm {...props} />) :
                        (<></>)
            )}
        </>
    )
}


function FormWindowActions({
                                 isSubmitting, onCancel
}: FormProps) {
    return (
        <div className={"flex-col w-full"}>
            <Separator className={"mb-3"}/>
            <div className={"flex gap-1"}>
                <Button
                    type={"button"}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button type={"reset"}>Reset</Button>
                <Button type={"submit"} disabled={isSubmitting} >
                    {isSubmitting ? "Uploading..." : "Submit"}
                </Button>
            </div>
        </div>
    )
}


function FormAddButton(windowProps: FormWindowProps) {
    const [formOpen, setFormOpen] = useState(false);

    return (
        <Popover open={formOpen} onOpenChange={setFormOpen}>
            <PopoverTrigger>
                <Button variant={"outline"}>
                    <PlusIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className={"w-max"}>
                <div className='m-1 p-0'>
                    <FormWindow {...windowProps}/>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export {
    FormWindow,
    FormWindowActions,
    FormAddButton,
}