import * as React from "react";
import Form, {type FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {FILTER_KEY_CONTENT_TYPE, type WhitelistFilter, type WhitelistFilters} from "@/components/paging/EntryPage.tsx";

type FilterFields = {
    contentType: string;
}


type FilterFieldsProps = {} & FormFieldsProps<FilterFields>
function FilterFields({
                          fields,
                          setKey
}: FilterFieldsProps) {
    return (
        <>
            <FieldInput
                id={"filter-content-type"}
                label={"Content Type"}
                createElement={(id) => (
                    <ContentTypeInput
                        id={id}
                        contentType={fields.contentType}
                        setContentType={(type) => {
                            setKey("contentType", type)
                        }}
                    />
                )}
            />
        </>
    )
}


function getFieldsFromFilters(whitelistFilters: WhitelistFilters): FilterFields {
    return {
        contentType: "",
        // contentType: whitelistFilters[FILTER_KEY_CONTENT_TYPE]
    }
}

export type FilterFormProps = {
    whitelistFilters: WhitelistFilters;
    setWhitelistFilter: (key: string, filter: WhitelistFilter) => void;
}
export default function FilterForm({
                                       whitelistFilters,
                                       setWhitelistFilter
}: FilterFormProps) {
    const initialFields = getFieldsFromFilters(whitelistFilters)

    // console.log("FILTER FORM:", props)
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