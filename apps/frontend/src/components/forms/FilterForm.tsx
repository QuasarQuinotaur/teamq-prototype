// Form used to fill out filtering options
// On submission the new field filters will be updated and change which entries can show up

import * as React from "react";
import Form, {type CreateFieldsElement, type FormState} from "@/components/forms/Form.tsx";

export type FilterFormProps<T> = {
    state?: FormState;
    defaultFieldsFilter: T;
    fieldsFilter: T;
    setFieldsFilter: (fieldFilters: T) => void;
    createFieldsElement: CreateFieldsElement<T>;
}
export default function FilterForm<T extends object>({
                                                         state,
                                                         defaultFieldsFilter,
                                                         fieldsFilter,
                                                         setFieldsFilter,
                                                         createFieldsElement,
}: FilterFormProps<T>) {
    async function handleSubmit(fields: T) {
        setFieldsFilter(fields);
    }

    return (
        <Form
            state={state}
            resetFields={defaultFieldsFilter}
            initialFields={fieldsFilter}
            createFieldsElement={createFieldsElement}
            submit={handleSubmit}
            submitText={"Apply"}
            noFixedHeight
            hideCancel
        />
    )
}