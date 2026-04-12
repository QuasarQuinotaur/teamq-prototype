// Form used to fill out filtering options
// On submission the new field filters will be updated and change which entries can show up

import * as React from "react";
import Form, {type CreateFieldsElement, type FormState} from "@/components/forms/Form.tsx";



// type FilterFieldsProps = {} & FormFieldsProps<FilterFields>
// function FilterFields({
//                           fields,
//                           setKey
// }: FilterFieldsProps) {
//     return (
//         <>
//             <FieldInput
//                 id={"filter-content-type"}
//                 label={"Content Type"}
//                 createElement={(id) => (
//                     <ContentTypeInput
//                         id={id}
//                         contentType={fields.contentType}
//                         setContentType={(type) => {
//                             setKey("contentType", type)
//                         }}
//                     />
//                 )}
//             />
//         </>
//     )
// }


export type FilterFormProps<T> = {
    state?: FormState;
    fieldFilters: T
    setFieldFilters: (fieldFilters: T) => void;
    createFieldsElement: CreateFieldsElement<T>;
}
export default function FilterForm<T extends object>({
                                                         state,
                                                         fieldFilters,
                                                         setFieldFilters,
                                                         createFieldsElement,
}: FilterFormProps<T>) {
    async function handleSubmit(fields: T) {
        setFieldFilters(fields);
    }

    return (
        <Form
            state={state}
            initialFields={fieldFilters}
            createFieldsElement={createFieldsElement}
            submit={handleSubmit}
        />
    )
}