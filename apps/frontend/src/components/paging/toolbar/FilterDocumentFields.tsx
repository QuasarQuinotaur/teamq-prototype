// Fields to include in filtering for Content

import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionInput from "@/components/input/JobPositionInput.tsx";

export type ContentFieldsFilter = {
    contentTypes?: string[];
    jobPositions?: string[];
}

export default function FilterDocumentFields({
                                                 fields,
                                                 setKey,
}: FormFieldsProps<ContentFieldsFilter>) {
    // TODO make these fields be multi-check dropdowns (can select multiple content types, job positions, etc.)
    return (
        <>
            <FieldInput
                id={"filter-documents-content-type"}
                label={"By Content Type"}
                createElement={(id) => (
                    <ContentTypeInput
                        id={id}
                        contentType={fields.contentTypes[0]}
                        setContentType={(type) => {
                            setKey("contentTypes", [type])
                        }}
                    />
                )}
            />
            <FieldInput
                id={"filter-documents-job-position"}
                label={"By Job Position"}
                createElement={(id) => (
                    <JobPositionInput
                        // TODO needs an option for "all"? Or all are selected by default
                        id={id}
                        jobPosition={fields.jobPositions[0]}
                        setJobPosition={(position) => {
                            setKey("jobPositions", [position])
                        }}
                    />
                )}
            />
        </>
    )
}