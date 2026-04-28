// This sets up a form with fields to be submitted
// Fields uses a generic, can be DocumentFields, EmployeeFields, etc. for field values
// Update for shared functionality between all forms

import {useState, useRef, useEffect, useCallback} from "react";
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
import type {Tag} from "db";


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
                         relaxedLayout,
}: FormActionsProps & FormState & { isSubmitting: boolean; relaxedLayout?: boolean }) {
    return (
        <div className={cn("flex-col w-full", relaxedLayout && "pt-2")}>
            <Separator className={relaxedLayout ? "mb-5 mt-1" : "mb-4"}/>
            <div className={"flex items-center gap-3"}>
                {!hideCancel && <Button
                    type={"button"}
                    variant={"ghost"}
                    onClick={onCancel}
                >
                    {cancelText ?? "Cancel"}
                </Button>}
                {!hideReset && <Button type={"reset"} variant={"outline"}>Reset</Button>}
                <Button id="tutorial-9" type={"submit"} disabled={isSubmitting} className={"ml-auto"}>
                    {submitText ? (typeof(submitText) == "string" ? submitText : submitText(isSubmitting)) :
                        isSubmitting ? "Saving..." : "Save"}
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
    /** When true, form body grows with content (e.g. modal) instead of a fixed scroll area */
    noFixedHeight?: boolean;
}
export type FormFieldsProps<T> = {
    fields: T,
    // Changes fields key to new value
    setKey: <K extends keyof T>(key: K, value: T[K]) => void;
    /** List of all active tags. */
    tagList?: Tag[]
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
    /** When true, the dialog to confirm updating won't appear */
    noUpdateConfirm?: boolean;
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
                                                   noUpdateConfirm,
                                                   ...actionsProps
}: FormProps<T> & FormActionsProps) {
    const scrollBodyNaturalHeight = noFixedHeight ?? state.noFixedHeight
    const [fields, setFields] = useState<T>(initialFields);
    const [lockedHeight, setLockedHeight] = useState<number | undefined>(undefined);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Lock the height to the tallest value seen — never shrink
    useEffect(() => {
        const el = scrollAreaRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const h = entry.contentRect.height;
            setLockedHeight(prev => (prev === undefined || h > prev) ? h : prev);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [validationError, setValidationError] = useState<string | null>(null)

    // Sets a key within the field to be updated
    function setKey<TKey extends keyof T>(key: TKey, value: T[TKey]) {
        handleKeyChange(setFields, key, value)
        setValidationError(null)
    }

    // Resets fields back to their initial fields
    function handleReset() {
        setFields(resetFields ?? initialFields)
        setSubmitError(null)
        setValidationError(null)
        if (reset) {
            reset()
        }
    }

    // Calls callback to perform async submit request
    async function doSubmit() {
        try {
            setIsSubmitting(true);

            await submit(fields)

            handleReset();
            if (state.onCancel) {
                state.onCancel();
            }
        } catch (error) {
            console.log("on submit,", error)
            setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Begins submission, requesting or prompting user to accept
    function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const error = getFieldsError ? getFieldsError(fields) : null;
        if (error) {
            setValidationError(typeof error === "string" ? error : "Please fill in all required fields.");
            return;
        }
        setValidationError(null);

        if (!noUpdateConfirm && state.baseItem) {
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
                <ScrollArea
                    ref={scrollAreaRef}
                    style={lockedHeight ? { minHeight: lockedHeight } : undefined}
                    className={cn(
                        scrollBodyNaturalHeight ? "" : "min-h-0",
                        "w-full",
                        scrollBodyNaturalHeight ? "pr-3 mb-6" : "pr-2 mb-5"
                    )}
                >
                    <FieldGroup
                        className={cn(scrollBodyNaturalHeight ? "px-0 py-3" : "px-1 py-3")}
                    >
                        <FieldSet className={cn(scrollBodyNaturalHeight ? "gap-0" : "gap-4")}>
                            <FieldGroup className={cn(scrollBodyNaturalHeight ? "gap-0" : "gap-4")}>
                                {createFieldsElement({
                                    fields,
                                    setKey,
                                })}
                            </FieldGroup>
                        </FieldSet>
                    </FieldGroup>
                </ScrollArea>
                {(validationError || submitError) && (
                    <div
                        className={cn(
                            "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                            scrollBodyNaturalHeight ? "mb-5" : "mb-3"
                        )}
                    >
                        <span className="mt-0.5 text-destructive">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </span>
                        <p className="text-sm text-destructive leading-snug">
                            {validationError ?? submitError}
                        </p>
                    </div>
                )}
                <FormActions
                    {...actionsProps}
                    {...state}
                    isSubmitting={isSubmitting}
                    relaxedLayout={scrollBodyNaturalHeight}
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