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
import {useLocation} from "react-router-dom";


const DEFAULT_DOCUMENT_FIELDS: ContentFields = {
    name: "",
    link: "",
    jobPositions: [],
    lastModifiedDate: undefined,
    expirationDate: undefined,
    contentType: "",
    file: null,
    sourceType: "file",
    newOwnerID: null,
}


function itemAsDocumentFields(item: object): ContentFields {
    const c = item as Content;
    const path = c.filePath ?? "";
    return {
        name: c.title,
        link: path,
        jobPositions: [...c.jobPositions],
        lastModifiedDate: new Date(c.dateUpdated),
        expirationDate: new Date(c.expirationDate),
        contentType: c.contentType,
        file: null,
        sourceType:
            path.startsWith("http://") || path.startsWith("https://")
                ? "link"
                : "file",
        newOwnerID: c.ownerId,
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
    const hasDocument =
        fields.sourceType === "file"
            ? fields.file != null ||
              (isUpdate && !!(fields.link?.trim()))
            : fields.link.trim() !== "";
    return (
        fields.name.trim() &&
        fields.jobPositions.length > 0 &&
        fields.expirationDate &&
        fields.contentType.trim() &&
        hasDocument
    );
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

    const [fileResetter, setFileResetter] = useState<(() => void) | null>( null)

    // Reset date strings
    function reset() {
        setExpirationString(initialExpirationString)
        if (fileResetter) {
            fileResetter()
        }
    }

    // This lets the document file field clear when reset button is clicked
    function updateFileResetter(resetter: () => void) {
        if (fileResetter == null) {
            setFileResetter(() => resetter)
        }
    }

    const isUpdate = state.baseItem != null;
    const existingFileName = isUpdate && initialFields.sourceType === "file"
        ? initialFields.link.split("/").pop() ?? initialFields.link
        : null

    // Create Content on backend from fields
    async function doSubmit(documentFields: ContentFields) {
        const isUpdate = state.baseItem != null;
        const isTutorial: boolean = window.location.href.includes("tutorial")
        console.log("updating")

        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/content/upload/${state.baseItem!.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/content/upload`;

        const formData = new FormData();

        // Required fields
        formData.append("name", documentFields.name);
        formData.append(
            "jobPositions",
            JSON.stringify(documentFields.jobPositions),
        );
        formData.append(
            "expirationDate",
            documentFields.expirationDate!.toISOString(),
        );
        formData.append("contentType", documentFields.contentType);

        if (isUpdate) {
            formData.append("newOwnerID", documentFields.newOwnerID.toString())
        }
        if (documentFields.file) {
            formData.append("file", documentFields.file);
        } else if (documentFields.link.trim()) {
            formData.append("link", documentFields.link.trim());
        }

        if (isTutorial) {
            formData.append("isTutorial", "true")
        } else {
            formData.append("isTutorial", "false")
        }

        const res = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            body: formData,
        });

        const result = await res.json();
        if (res.status === 409) {
            throw new Error(
                "Upload failed: a file with that name already exists in the database. Change the file name or request access.",
            );
        }

        if (!res.ok) {
            throw new Error(
                result.error || (isUpdate ? "Update failed" : "Upload failed"),
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
                    updateFileResetter={updateFileResetter}
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
