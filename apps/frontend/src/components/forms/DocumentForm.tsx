// Form for uploading content to backend (workflow, reference, tool)

import { useState } from "react";

import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldSet,
} from "@/components/forms/Field.tsx"
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


type DocumentFields = {
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
        <FieldSet>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-name"}>Document Name</FieldLabel>
                    <Input
                        id={"document-add-form-name"}
                        placeholder={"Name"}
                        value={fields.name}
                        onChange={(e) => {
                            setKey("name", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="document-add-form-file">Document File</FieldLabel>
                    {/*TODO: Needs to clear when form is reset*/}
                    <Input
                        id="document-add-form-file"
                        type="file"
                        onChange={(e) => {
                            setKey("file", e.target.files?.[0] ?? null)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-link"}>Document Link</FieldLabel>
                    <Input
                        id={"document-add-form-link"}
                        placeholder={"https://..."}
                        type={"url"}
                        value={fields.link}
                        onChange={(e) => {
                            setKey("link", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-job-position"}>Job Position</FieldLabel>
                    <JobPositionInput
                        id={"document-add-form-job-position"}
                        jobPosition={fields.jobPosition}
                        setJobPosition={(position) => {
                            setKey("jobPosition", position)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-last-modified"}>Last Modified Date</FieldLabel>
                    <DateSelectInput
                        id={"document-add-form-last-modified"}
                        placeholder={"Last Modified Date"}
                        date={fields.lastModifiedDate}
                        setDate={(date) => {
                            setKey("lastModifiedDate", date)
                        }}
                        dateString={dateStrings.lastModified}
                        setDateString={dateStrings.setLastModified}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-expiration"}>Expiration Date</FieldLabel>
                    <DateSelectInput
                        id={"document-add-form-expiration"}
                        placeholder={"Expiration Date"}
                        date={fields.expirationDate}
                        setDate={(date) => {
                            setKey("expirationDate", date)
                        }}
                        dateString={dateStrings.expiration}
                        setDateString={dateStrings.setExpiration}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-content-type"}>Content Type</FieldLabel>
                    <ContentTypeInput
                        id={"document-add-form-content-type"}
                        contentType={fields.contentType}
                        setContentType={(type) => {
                            setKey("contentType", type)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-status"}>Document Status</FieldLabel>
                    <DocumentStatusInput
                        id={"document-add-form-status"}
                        status={fields.status}
                        setStatus={(status) => {
                            setKey("status", status)
                        }}
                    />
                </Field>
            </FieldGroup>
        </FieldSet>
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

        const formData = new FormData();

        // Required fields
        formData.append("name", documentFields.name);
        formData.append("jobPosition", documentFields.jobPosition);
        formData.append(
            "expirationDate",
            documentFields.expirationDate!.toISOString()
        );
        formData.append("contentType", documentFields.contentType);
        formData.append("status", documentFields.status);
        if (documentFields.file && !documentFields.link) {
            formData.append("file", documentFields.file); // <-- MUST match "file" in multer
        } else if (documentFields.link && !documentFields.file) {
            formData.append("link", documentFields.link);
        }

        const res = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            body: formData, // <-- no JSON, no stringify
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(
                result.error || (isUpdate ? "Update failed" : "Upload failed")
            );
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