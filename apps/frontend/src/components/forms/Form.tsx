// This sets up a form with fields to be submitted
// Fields uses a generic, can be DocumentFields, EmployeeFields, etc. for field values
// Update for shared functionality between all forms

import {useState} from "react";
import * as React from "react";

import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialog as AlertDialog
} from "@/components/dialog/AlertDialog.tsx";
import {ScrollArea} from "@/elements/scroll-area.tsx";
import {FieldGroup, FieldSet} from "@/components/forms/Field.tsx";
import {cn, handleKeyChange} from "@/lib/utils.ts";
import {Separator} from "@/elements/separator.tsx";
import {Button} from "@/elements/buttons/button.tsx";


type FormActionsProps = {
    submitText?: string | ((isSubmitting: boolean) => string);
    cancelText?: string;
    hideReset?: boolean;
    hideCancel?: boolean;
}
function FormActions({
                         submitText,
                         cancelText,
                         hideReset,
                         hideCancel,
                         isSubmitting,
                         onCancel,
}: FormActionsProps & FormState & { isSubmitting: boolean }) {
    // Creates cancel-reset-submit buttons
    return (
        <div className={"flex-col w-full"}>
            <Separator className={"mb-3"}/>
            <div className={"flex gap-1"}>
                {!hideCancel && <Button
                    type={"button"}
                    onClick={onCancel}
                >
                    {cancelText ?? "Cancel"}
                </Button>}
                {!hideReset && <Button type={"reset"}>Reset</Button>}
                <Button type={"submit"} disabled={isSubmitting}>
                    {submitText ? (typeof(submitText) == "string" ? submitText : submitText(isSubmitting)) :
                        isSubmitting ? "Uploading..." : "Submit"}
                </Button>
            </div>
        </div>
    )
}


export type FormState = {
    // Pass in to fill form with existing data
    baseItem?: object & { id: number };
    // Apply default properties if not filled in
    defaultItem?: object;
    onCancel?: () => void;
}
export type FormFieldsProps<T> = {
    fields: T,
    // Changes fields key to new value
    setKey: <K extends keyof T>(key: K, value: T[K]) => void;
}
export type CreateFieldsElement<T> = (props: FormFieldsProps<T>) => React.ReactNode

type FormProps<T> = {
    state?: FormState;
    initialFields: T;
    createFieldsElement: CreateFieldsElement<T>;
    submit: (fields: T) => Promise<void>;
    reset?: () => void;
    // If specified will be set on reset instead of initial fields
    resetFields?: T;
    // Return an error to display + prevent submitting
    getFieldsError?: (fields: T) => boolean | string | null | undefined;
    noFixedHeight?: boolean;
}
export default function Form<T extends object>({
                                                   state = {},
                                                   initialFields = {} as T,
                                                   createFieldsElement,
                                                   submit,
                                                   reset,
                                                   resetFields,
                                                   getFieldsError,
                                                   noFixedHeight,
                                                   ...actionsProps
}: FormProps<T> & FormActionsProps) {
    const [fields, setFields] = useState<T>(initialFields);
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    // Sets a key within the field to be updated
    function setKey<TKey extends keyof T>(key: TKey, value: T[TKey]) {
        handleKeyChange(setFields, key, value)
    }

    // Resets fields back to their initial fields
    function handleReset() {
        setFields(resetFields ?? initialFields)
        if (reset) {
            reset()
        }
    }

    // Calls callback to perform async submit request
    async function doSubmit() {
        // TODO Display better error + success status
        try {
            setIsSubmitting(true);

            await submit(fields)

            handleReset();
            if (state.onCancel) {
                state.onCancel();
            }
        } catch (error) {
            console.error("Submit failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Begins submission, requesting or prompting user to accept
    function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        // TODO Display better error status
        const error = getFieldsError ? getFieldsError(fields) : null;
        if (error) {
            console.error(error);
            return;
        }

        if (state.baseItem) {
            // Updating item, show dialog
            setConfirmOpen(true);
        } else {
            // Quick submit
            void doSubmit();
        }
    }

    return (
        <AlertDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
        >
            <form
                onReset={(e) => {
                    e.preventDefault()
                    handleReset()
                }}
                onSubmit={handleSubmit}
            >
                <ScrollArea className={cn(noFixedHeight ? "" : "h-96", "w-full pr-4 mb-4")}>
                    {/*TODO: Form can cut off if you shrink your window height*/}
                    <FieldGroup className={"p-1"}>
                        <FieldSet>
                            <FieldGroup>
                                {/*This makes all field elements (different based on type of form)*/}
                                {createFieldsElement({
                                    fields,
                                    setKey,
                                })}
                            </FieldGroup>
                        </FieldSet>
                    </FieldGroup>
                </ScrollArea>
                <FormActions
                    {...actionsProps}
                    {...state}
                    isSubmitting={isSubmitting}
                />
            </form>

            {/*Confirmation dialog (only if updating)*/}
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will save your changes.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            setConfirmOpen(false);
                            void doSubmit();
                        }}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}