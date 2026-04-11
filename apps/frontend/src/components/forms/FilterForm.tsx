import * as React from "react";
import Form, {type FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";

type FilterFields = {
    documentType: string;
}


type FilterFieldsProps = {} & FormFieldsProps<FilterFields>
function FilterFields({
                          fields,
                          setKey
}: FilterFieldsProps) {
    return (
        <>
            <FieldInput
                id={"filter-document-type"}
                label={"Document Type"}
                createElement={(id) => (
                    <ContentTypeInput
                        id={id}
                        contentType={fields.documentType}
                        setContentType={(type) => {
                            setKey("documentType", type)
                        }}
                    />
                )}
            />
        </>
    )
}

export default function FilterForm() {
    return (
        <>
        </>
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