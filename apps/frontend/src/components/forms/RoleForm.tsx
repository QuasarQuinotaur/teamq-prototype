import Form, {type FormState} from "@/components/forms/Form.tsx";
import type {Employee, Role} from "db";
import RoleFormFields, { type RoleFields } from "./RoleFormFields";
import { formatDashCase } from "@/lib/utils";


const DEFAULT_ROLE_FIELDS: RoleFields = {
    name: "",
    permissionLevel: 0
}

function itemAsRole(item: object): RoleFields {
    const r = item as Role;
    return {
        name: r.name,
        permissionLevel: r.permissionLevel
    };
}

function getDefaultRoleFields(defaultItem: object = null): RoleFields {
    return DEFAULT_ROLE_FIELDS
}

function hasRequiredRoleFields(fields: RoleFields): boolean {
    return fields.name.trim().length > 0
}

export type RoleFormProps = {
    permissionLevel: number;
    onSubmitted?: () => void;
} & FormState
export default function RoleForm({
                                    permissionLevel,
                                    onSubmitted,
                                    ...state
}: RoleFormProps) {
    const initialFields =
        state.baseItem ? itemAsRole(state.baseItem) :
            getDefaultRoleFields(state.defaultItem)

    // Create or update role on backend from fields
    async function doSubmit(fields: RoleFields) {
        const isUpdate = state.baseItem != null;
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/roles/${state.baseItem.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/roles`;
        const name = fields.name
        const role = {
            key: !isUpdate && formatDashCase(name),
            name: name,
            permissionLevel: fields.permissionLevel
        }
        const response = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(role),
        })
        const result = await response.json()
        console.log("REPSONSE:", response, "|", result)
        if (response.ok && result && result.success) {
            if (onSubmitted) {
                onSubmitted()
            }
        } else {
            throw new Error(result ? result.error : `Failed to ${isUpdate ? "update" : "create"} role`)
        }
    }

    return (
        <Form
            state={state}
            initialFields={initialFields}
            createFieldsElement={(props) => (
                // Create document form specific field elements
                <RoleFormFields
                    {...props}
                    permissionLevel={permissionLevel}
                />
            )}
            submit={doSubmit}
            getFieldsError={(fields) => {
                // Show an error if missing fields
                if (!hasRequiredRoleFields(fields)) {
                    return "Missing required fields."
                }
            }}
        />
    )
}