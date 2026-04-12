// Fields to include in filtering for Content

import * as React from "react";
import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import ContentTypeMultiInput from "@/components/input/ContentTypeMultiInput.tsx";
import DocumentTypeInput from "@/components/input/DocumentTypeInput.tsx";
import type {DocumentType} from "@/components/input/constants.tsx";


export type ContentFieldsFilter = {
    contentTypes?: string[];
    jobPositions?: string[];
    documentTypes?: DocumentType[];
}

export default function FilterDocumentFields({
                                                 fields,
                                                 setKey,
}: FormFieldsProps<ContentFieldsFilter>) {
    console.log("Fields for document filter:", fields)

    return (
        <>
            <FieldInput
                id={"filter-documents-content-type"}
                label={"By Content Type"}
                createElement={(id) => (
                    <ContentTypeMultiInput
                        id={id}
                        contentTypes={fields.contentTypes ?? []}
                        setContentTypes={(types) => {
                            setKey("contentTypes", types)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"filter-documents-job-position"}
                label={"By Job Position"}
                createElement={(id) => (
                    <JobPositionInput
                        id={id}
                        jobPositions={fields.jobPositions ?? []}
                        setJobPositions={(positions) => {
                            setKey("jobPositions", positions)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"filter-documents-document-type"}
                label={"By Document Type"}
                createElement={(id) => (
                    <DocumentTypeInput
                        id={id}
                        documentTypes={fields.documentTypes ?? []}
                        setDocumentTypes={(types) => {
                            setKey("documentTypes", types)
                        }}
                    />
                )}
            />
        </>
    )
}