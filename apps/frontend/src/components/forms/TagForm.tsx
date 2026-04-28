import Form, {type FormState} from "@/components/forms/Form.tsx";
import TagFormFields, {type TagFields} from "@/components/forms/TagFormFields.tsx";
import type {Tag} from "db";

const DEFAULT_TAG_FIELDS: TagFields = {
    name: "",
    color: "#ff0000",
    isGlobal: false,
};

function itemAsTag(item: object): TagFields {
    const t = item as Tag;
    return {
        name: t.tagName,
        color: t.color,
        isGlobal: t.isGlobal ?? false,
    };
}

function getDefaultTagFields(): TagFields {
    return DEFAULT_TAG_FIELDS;
}

function hasRequiredTagFields(fields: TagFields): boolean {
    return fields.name.trim().length > 0;
}

export type TagFormProps = {
    onSubmitted?: () => void;
    isAdmin?: boolean;
} & FormState;

export default function TagForm({ onSubmitted, isAdmin, ...state }: TagFormProps) {
    const initialFields = state.baseItem
        ? itemAsTag(state.baseItem)
        : getDefaultTagFields();

    const isCreate = !state.baseItem;

    async function doSubmit(fields: TagFields) {
        const isUpdate = state.baseItem != null;
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/tags/${state.baseItem.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/tags`;

        const payload: { tagName: string; color: string; isGlobal?: boolean } = {
            tagName: fields.name,
            color: fields.color,
        };
        if (!isUpdate && isAdmin && fields.isGlobal) {
            payload.isGlobal = true;
        }

        await fetch(url, {
            method: isUpdate ? "PATCH" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (onSubmitted) {
            onSubmitted();
        }
    }

    return (
        <Form
            state={state}
            initialFields={initialFields}
            createFieldsElement={(props) => (
                <TagFormFields
                    {...props}
                    isAdmin={isAdmin}
                    isCreate={isCreate}
                />
            )}
            submit={doSubmit}
            getFieldsError={(fields) => {
                if (!hasRequiredTagFields(fields)) {
                    return "Missing required fields.";
                }
            }}
            noUpdateConfirm
        />
    );
}
