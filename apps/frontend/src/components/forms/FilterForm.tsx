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
    emptyFieldsFilter?: T;
    defaultFieldsFilter: T;
    fieldsFilter: T;
    setFieldsFilter: (fieldFilters: T) => void;
    createFieldsElement: CreateFieldsElement<T>;
}
export default function FilterForm<T extends object>({
                                                         emptyFieldsFilter,
                                                         defaultFieldsFilter,
                                                         fieldsFilter,
                                                         setFieldsFilter,
                                                         createFieldsElement,
}: FilterFormProps<T>) {

    // Sets a key within the field to be updated
    function setKey<TKey extends keyof T>(key: TKey, value: T[TKey]) {
        handleKeyChange(setFieldsFilter, key, value)
    }

    // Resets all filters to default
    function handleResetFilters() {
        setFieldsFilter(defaultFieldsFilter);
    }

    // Removes all filters
    function handleRemoveFilters() {
        setFieldsFilter(emptyFieldsFilter);
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
                                fields: fieldsFilter,
                                setKey,
                            })}
                        </FieldGroup>
                    </FieldSet>
                </FieldGroup>
            </ScrollArea>
            <div className={"flex-col w-full"}>
                <Separator className={"mb-3"}/>
                <div className={"flex gap-1"}>
                    {emptyFieldsFilter && <Button
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