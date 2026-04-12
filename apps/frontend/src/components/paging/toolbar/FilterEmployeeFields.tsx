// Fields to include in filtering for Employee

import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionInput from "@/components/input/JobPositionInput.tsx";

export type EmployeeFieldsFilter = object

export default function FilterEmployeeFields({
                                                 fields,
                                                 setKey,
}: FormFieldsProps<EmployeeFieldsFilter>) {
    return (
        <>
            {/*<FieldInput*/}
            {/*    id={"filter-documents-content-type"}*/}
            {/*    label={"By Content Type"}*/}
            {/*    createElement={(id) => (*/}
            {/*        <ContentTypeInput*/}
            {/*            id={id}*/}
            {/*            contentType={fields.contentTypes[0]}*/}
            {/*            setContentType={(type) => {*/}
            {/*                setKey("contentTypes", [type])*/}
            {/*            }}*/}
            {/*        />*/}
            {/*    )}*/}
            {/*/>*/}
        </>
    )
}