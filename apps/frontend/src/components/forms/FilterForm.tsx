import * as React from "react";
import type {KeyFilters} from "@/components/paging/entry-page-filter.tsx";
import Form, {type CreateFieldsElement, type FormFieldsProps, type FormState} from "@/components/forms/Form.tsx";



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
    fieldFilters?: T
    createFieldsElement: CreateFieldsElement<T>;
    // setKeyFilter: (key: string, filter: KeyFilters<T>) => void;
}
export default function FilterForm<T extends object>({
                                                         state,
                                                         fieldFilters,
                                                         createFieldsElement,
}: FilterFormProps<T>) {
    console.log(fieldFilters);

    return (
        <Form
            state={state}
            initialFields={fieldFilters}
            createFieldsElement={createFieldsElement}
            submit={null}
        />
        // <Form
        //     state={state}
        //     initialFields={DEFAULT_FILTER_FIELDS}
        //     createFieldsElement={FilterFields}
        //     submit={handleSubmit}
        //     hideCancel
        //     hideReset
        // />
    )
}