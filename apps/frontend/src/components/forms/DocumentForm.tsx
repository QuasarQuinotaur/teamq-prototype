// Form for uploading content to backend (workflow, reference, tool)

import { useState } from "react";

import { formatDate } from "@/lib/utils.ts";
import Form, {
    type FormState
} from "@/components/forms/Form.tsx";
import type {Content} from "db";
import DocumentFormFields, {type DocumentDateStrings} from "@/components/forms/DocumentFormFields.tsx";


export type ContentFields = {
    name: string,
    link: string,
    jobPosition: string,
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
    status: string,
    file: File | null,
}
const DEFAULT_DOCUMENT_FIELDS: ContentFields = {
    name: "",
    link: "",
    jobPosition: "",
    lastModifiedDate: undefined,
    expirationDate: undefined,
    contentType: "",
    status: "",
    file: null,
}


function itemAsDocumentFields(item: object): ContentFields {
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

function getDefaultDocumentFields(defaultItem: object = null): ContentFields {
    if (defaultItem == null) {
        return DEFAULT_DOCUMENT_FIELDS
    }
    const c = defaultItem as Content
    return {
        ...DEFAULT_DOCUMENT_FIELDS,
        contentType: c.contentType ?? ""
    }
}

function hasRequiredDocumentFields(fields: ContentFields) {
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
    async function doSubmit(documentFields: ContentFields) {
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