// Form used to fill out filtering options
// On submission the new field filters will be updated and change which entries can show up

import * as React from "react";
import {type CreateFieldsElement, type FormState} from "@/components/forms/Form.tsx";
import {ScrollArea} from "@/elements/scroll-area.tsx";
import {handleKeyChange} from "@/lib/utils.ts";
import {FieldGroup, FieldSet} from "@/components/forms/Field.tsx";
import {Separator} from "@/elements/separator.tsx";
import {Button} from "@/elements/buttons/button.tsx";

export type FilterFormProps<T> = {
    emptyFields?: T;
    defaultFields: T;
    fields: T;
    setFields: (fieldFilters: T) => void;
    createFieldsElement: CreateFieldsElement<T>;
}
export default function FilterForm<T extends object>({
                                                         emptyFields,
                                                         defaultFields,
                                                         fields,
                                                         setFields,
                                                         createFieldsElement,
}: FilterFormProps<T>) {

    // Sets a key within the field to be updated
    function setKey<TKey extends keyof T>(key: TKey, value: T[TKey]) {
        handleKeyChange(setFields, key, value)
    }

    // Resets all filters to default
    function handleResetFilters() {
        setFields(defaultFields);
    }

    // Removes all filters
    function handleRemoveFilters() {
        setFields(emptyFields);
    }

    return (
        <form
            onReset={(e) => {
                e.preventDefault()
                handleResetFilters()
            }}
        >
            <ScrollArea className={"w-full pr-4 mb-4"}>
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
            <div className={"flex-col w-full"}>
                <Separator className={"mb-3"}/>
                <div className={"flex gap-1"}>
                    {emptyFields && <Button
                        type={"button"}
                        onClick={handleRemoveFilters}
                    >
                        Remove Filters
                    </Button>}
                    <Button type={"reset"}>Reset Filters</Button>
                </div>
            </div>
            {/*<FormActions*/}
            {/*    {...actionsProps}*/}
            {/*    {...state}*/}
            {/*    isSubmitting={isSubmitting}*/}
            {/*/>*/}
        </form>
    )
}