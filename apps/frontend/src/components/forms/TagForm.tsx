import {formatDate} from "@/lib/utils.ts";
import {useState} from "react";
import DocumentFormFields, {type ContentFields, type DocumentDateStrings} from "@/components/forms/DocumentFormFields.tsx";
import Form, {type FormState} from "@/components/forms/Form.tsx";
import TagFormFields, {type TagFields} from "@/components/forms/TagFormFields.tsx";
import type {Employee, Tag} from "db";
import type {EmployeeFields} from "@/components/forms/EmployeeFormFields.tsx";


const DEFAULT_TAG_FIELDS: TagFields = {
    name: "",
    color: "#ff0000"
}

function itemAsTag(item: object): TagFields {
    const t = item as Tag;
    return {
        name: t.tagName,
        color: t.color,
    };
}

function getDefaultTagFields(defaultItem: object = null): TagFields {
    return DEFAULT_TAG_FIELDS
}

function hasRequiredTagFields(fields: TagFields): boolean {
    return fields.name.trim().length > 0
}

export type TagFormProps = {
    onSubmitted?: () => void;
} & FormState
export default function TagForm({
                                    onSubmitted,
                                    ...state
}: TagFormProps) {
    const initialFields =
        state.baseItem ? itemAsTag(state.baseItem) :
            getDefaultTagFields(state.defaultItem)

    // Create or update tag on backend from fields
    async function doSubmit(fields: TagFields) {
        console.log("NEW TAG:", fields)
        const isUpdate = state.baseItem != null;
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/tags/${state.baseItem.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/tags`;
        const tag = {
            tagName: fields.name,
            color: fields.color,
        }
        await fetch(url, {
            method: isUpdate ? "PATCH" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tag),
        })
        if (onSubmitted) {
            onSubmitted()
        }
    }

    return (
        <Form
            state={state}
            initialFields={initialFields}
            createFieldsElement={(props) => (
                // Create document form specific field elements
                <TagFormFields
                    {...props}
                />
            )}
            submit={doSubmit}
            getFieldsError={(fields) => {
                // Show an error if missing fields
                if (!hasRequiredTagFields(fields)) {
                    return "Missing required fields."
                }
            }}
            noUpdateConfirm
        />
    )
}