// Form for uploading content to backend (workflow, reference, tool)

import { useState } from "react";

import { formatDate } from "@/lib/utils.ts";
import Form, {
    type FormState
} from "@/components/forms/Form.tsx";
import type {Content} from "db";
import DocumentFormFields, {
    type ContentFields,
    type DocumentDateStrings
} from "@/components/forms/DocumentFormFields.tsx";


const DEFAULT_DOCUMENT_FIELDS: ContentFields = {
    name: "",
    link: "",
    jobPosition: "",
    lastModifiedDate: undefined,
    expirationDate: undefined,
    contentType: "",
    status: "",
    file: null,
    sourceType: "file",
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
        sourceType: c.link.startsWith("http://") || c.link.startsWith("https://") ? "link" : "file",
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

function hasRequiredDocumentFields(fields: ContentFields, isUpdate: boolean) {
    const hasDocument = fields.sourceType === "file"
        ? (fields.file != null || isUpdate)
        : fields.link.trim() !== ""
    return fields.name.trim() && fields.jobPosition.trim()
        && fields.expirationDate && fields.contentType.trim()
        && hasDocument
}


export default function DocumentForm(state: FormState) {
    const initialFields =
        state.baseItem ? itemAsDocumentFields(state.baseItem) :
            getDefaultDocumentFields(state.defaultItem)
    const initialExpirationString =
        initialFields.expirationDate ? formatDate(initialFields.expirationDate) : ""

    const [expirationString, setExpirationString] = useState(initialExpirationString)
    const dateStrings: DocumentDateStrings = {
        expiration: expirationString,
        setExpiration: setExpirationString,
    };

    // Reset date strings
    function reset() {
        setExpirationString(initialExpirationString)
    }

    const isUpdate = state.baseItem != null;
    const existingFileName = isUpdate && initialFields.sourceType === "file"
        ? initialFields.link.split("/").pop() ?? initialFields.link
        : null

    // Create Content on backend from fields
    async function doSubmit(documentFields: ContentFields) {
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/upload/${state.baseItem!.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/upload`;

        const formData = new FormData();
        formData.append("name", documentFields.name);
        formData.append("jobPosition", documentFields.jobPosition);
        formData.append("expirationDate", documentFields.expirationDate!.toISOString());
        formData.append("contentType", documentFields.contentType);
        formData.append("status", isUpdate ? documentFields.status : "to-do");

        if (documentFields.sourceType === "file") {
            if (documentFields.file) {
                formData.append("file", documentFields.file);
            } else {
                // No new file chosen — preserve the original stored path
                // Use initialFields.link as it may have been cleared by a mode toggle
                formData.append("link", documentFields.link || initialFields.link);
            }
        } else {
            formData.append("link", documentFields.link.trim());
        }

        const res = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            body: formData,
        });

        const result = await res.json();
        if (res.status === 409) {
            throw new Error("Upload failed: a file with that name already exists in the database. Change the file name or request access.");
        }
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
                    isUpdate={isUpdate}
                    existingFileName={existingFileName}
                />
            )}
            submit={doSubmit}
            reset={reset}
            getFieldsError={(fields) => {
                // Show an error if missing fields
                if (!hasRequiredDocumentFields(fields, isUpdate)) {
                    return "Missing required fields."
                }
            }}
        />
    )
}
