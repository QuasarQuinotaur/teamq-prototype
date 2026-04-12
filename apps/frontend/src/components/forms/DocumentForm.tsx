// Form for uploading content to backend (workflow, reference, tool)

import { useState } from "react";

import { FieldInput } from "@/components/forms/Field.tsx"
import { Input } from "@/elements/input.tsx"
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import DocumentStatusInput from "@/components/input/DocumentStatusInput.tsx";
import { formatDate } from "@/lib/utils.ts";
import Form, {
    type FormFieldsProps,
    type FormState
} from "@/components/forms/Form.tsx";
import type {Content} from "db";


export type DocumentFields = {
    name: string,
    link: string,
    jobPosition: string,
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
    status: string,
    file: File | null,
}
const DEFAULT_DOCUMENT_FIELDS: DocumentFields = {
    name: "",
    link: "",
    jobPosition: "",
    lastModifiedDate: undefined,
    expirationDate: undefined,
    contentType: "",
    status: "",
    file: null,
}

type DocumentDateStrings = {
    lastModified: string,
    setLastModified: (lastModified: string) => void,
    expiration: string,
    setExpiration: (expirationDate: string) => void,
}
type DocumentFormFieldsProps = {
    dateStrings: DocumentDateStrings
} & FormFieldsProps<DocumentFields>
function DocumentFormFields({
                                fields,
                                setKey,
                                dateStrings
}: DocumentFormFieldsProps) {
    return (
        <>
            <FieldInput
                id={"document-add-form-name"}
                label={"Document Name"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder={"Name"}
                        value={fields.name}
                        onChange={(e) => {
                            setKey("name", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-file"}
                label={"Document File"}
                createElement={(id) => (
                    // TODO: Needs to clear when form is reset
                    <Input
                        id={id}
                        type={"file"}
                        onChange={(e) => {
                            setKey("file", e.target.files?.[0] ?? null)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-link"}
                label={"Document Link"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder={"https://..."}
                        type={"url"}
                        value={fields.link}
                        onChange={(e) => {
                            setKey("link", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-job-position"}
                label={"Job Position"}
                createElement={(id) => (
                    <JobPositionInput
                        id={id}
                        jobPosition={fields.jobPosition}
                        setJobPosition={(position) => {
                            setKey("jobPosition", position)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-last-modified"}
                label={"Last Modified Date"}
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder={"Last Modified Date"}
                        date={fields.lastModifiedDate}
                        setDate={(date) => {
                            setKey("lastModifiedDate", date)
                        }}
                        dateString={dateStrings.lastModified}
                        setDateString={dateStrings.setLastModified}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-expiration"}
                label={"Expiration Date"}
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder={"Expiration Date"}
                        date={fields.expirationDate}
                        setDate={(date) => {
                            setKey("expirationDate", date)
                        }}
                        dateString={dateStrings.expiration}
                        setDateString={dateStrings.setExpiration}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-content-type"}
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
            <FieldInput
                id={"document-add-form-status"}
                label={"Document Status"}
                createElement={(id) => (
                    <DocumentStatusInput
                        id={id}
                        status={fields.status}
                        setStatus={(status) => {
                            setKey("status", status)
                        }}
                    />
                )}
            />
        </>
    )
}


function itemAsDocumentFields(item: object): DocumentFields {
    const c = item as Content;
    return {
        name: c.title,
        link: c.link,
        jobPosition: c.jobPosition,
        lastModifiedDate: new Date(c.dateUpdated),
        expirationDate: new Date(c.expirationDate),
        contentType: c.contentType,
        status: c.status,
        file: null,
    }
}

function getDefaultDocumentFields(defaultItem: object = null): DocumentFields {
    if (defaultItem == null) {
        return DEFAULT_DOCUMENT_FIELDS
    }
    const c = defaultItem as Content
    return {
        ...DEFAULT_DOCUMENT_FIELDS,
        contentType: c.contentType ?? ""
    }
}

function hasRequiredDocumentFields(fields: DocumentFields) {
    return fields.name.trim() && fields.jobPosition.trim()
        && fields.expirationDate && fields.contentType.trim()
        && fields.status.trim() && (fields.file || fields.link.trim())
}


export default function DocumentForm(state: FormState) {
    const initialFields =
        state.baseItem ? itemAsDocumentFields(state.baseItem) :
            getDefaultDocumentFields(state.defaultItem)
    const initialLastModifiedString =
        initialFields.lastModifiedDate ? formatDate(initialFields.lastModifiedDate) : ""
    const initialExpirationString =
        initialFields.expirationDate ? formatDate(initialFields.expirationDate) : ""

    const [lastModifiedString, setLastModifiedString] = useState(initialLastModifiedString)
    const [expirationString, setExpirationString] = useState(initialExpirationString)
    const dateStrings: DocumentDateStrings = {
        lastModified: lastModifiedString,
        setLastModified: setLastModifiedString,
        expiration: expirationString,
        setExpiration: setExpirationString,
    };

    // Reset date strings
    function reset() {
        setLastModifiedString(initialLastModifiedString)
        setExpirationString(initialExpirationString)
    }

    // Create Content on backend from fields
    async function doSubmit(documentFields: DocumentFields) {
        const isUpdate = state.baseItem != null;
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/upload/${state.baseItem!.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/upload`;
        const body = {
            name: documentFields.name,
            jobPosition: documentFields.jobPosition,
            expirationDate: documentFields.expirationDate!.toISOString(),
            contentType: documentFields.contentType,
            status: documentFields.status,
            file: documentFields.file && !documentFields.link ? documentFields.file : null,
            link: documentFields.link && !documentFields.file ? documentFields.link : null,
        }
        const res = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.error || (isUpdate ? "Update failed" : "Upload failed"));
        }
    }

    return (
        <Form
            state={state}
            initialFields={initialFields}
            createFieldsElement={(props) => (
                // Create document form specific field elements
                <DocumentFormFields
                    {...props}
                    dateStrings={dateStrings}
                />
            )}
            submit={doSubmit}
            reset={reset}
            getFieldsError={(fields) => {
                // Show an error if missing fields
                if (!hasRequiredDocumentFields(fields)) {
                    return "Missing required fields."
                }
            }}
        />
    )
}