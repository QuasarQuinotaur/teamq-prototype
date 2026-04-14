// Form used to fill out filtering options
// On submission the new field filters will be updated and change which entries can show up

import * as React from "react";
import {type CreateFieldsElement, type FormState} from "@/components/forms/Form.tsx";
import {ScrollArea} from "@/elements/scroll-area.tsx";
import {handleKeyChange} from "@/lib/utils.ts";
import {FieldGroup, FieldInput, FieldSet} from "@/components/forms/Field.tsx";
import {Separator} from "@/elements/separator.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import ContentTypeMultiInput from "@/components/input/ContentTypeMultiInput.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";
import {JOB_POSITION_TYPE_MAP, SORT_METHOD_TYPE_MAP, type SortMethod} from "@/components/input/constants.tsx";
import {useEffect, useState} from "react";

export type SortFields = {
    sortBy: string;
    sortMethod: SortMethod;
}

export type SortFormProps = {
    sortByMap: {[key: string]: string};
    defaultSortFields: SortFields;
    sortFields: SortFields;
    setSortFields: (fields: SortFields) => void;
}
export default function SortForm({
                                     sortByMap,
                                     defaultSortFields,
                                     sortFields,
                                     setSortFields
}: SortFormProps) {

    // Sets a key within the field to be updated
    function setKey<TKey extends keyof SortFields>(key: TKey, value: SortFields[TKey]) {
        handleKeyChange(setSortFields, key, value)
    }

    // Resets all sorting to default
    function handleResetSort() {
        setSortFields(defaultSortFields)
    }

    return (
        <form
            onReset={(e) => {
                e.preventDefault()
                handleResetSort()
            }}
        >
            <ScrollArea className={"w-full pr-4 mb-4"}>
                {/*TODO: Form can cut off if you shrink your window height*/}
                <FieldGroup className={"p-1"}>
                    <FieldSet>
                        <FieldGroup>
                            <FieldInput
                                id={"sort-form-by"}
                                label={"Sort By"}
                                createElement={(id) => (
                                    <SelectMapInput
                                        id={id}
                                        map={sortByMap}
                                        initValue={sortFields.sortBy}
                                        setValue={(newSortBy) => {
                                            setKey("sortBy", newSortBy)
                                        }}
                                        placeholder={"Choose property"}
                                    />
                                )}
                            />
                            <FieldInput
                                id={"sort-form-method"}
                                label={"Sort Method"}
                                createElement={(id) => (
                                    <SelectMapInput
                                        id={id}
                                        map={SORT_METHOD_TYPE_MAP}
                                        initValue={sortFields.sortMethod}
                                        setValue={(newSortMethod) => {
                                            setKey("sortMethod", newSortMethod as SortMethod)
                                        }}
                                    />
                                )}
                            />
                        </FieldGroup>
                    </FieldSet>
                </FieldGroup>
            </ScrollArea>
            <div className={"flex-col w-full"}>
                <Separator className={"mb-3"}/>
                <div className={"flex gap-1"}>
                    <Button type={"reset"}>Reset Sorting</Button>
                </div>
            </div>
        </form>
    )
}