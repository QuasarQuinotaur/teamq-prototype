// Form for adding employees on backend

import { useState } from "react";
import { formatDate } from "@/lib/utils.ts";
import type {Employee} from "db";
import Form, {
    type FormState
} from "@/components/forms/Form.tsx";
import EmployeeFormFields, {
    type EmployeeDateStrings,
    type EmployeeFields
} from "@/components/forms/EmployeeFormFields.tsx";


const DEFAULT_EMPLOYEE_FIELDS: EmployeeFields = {
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: undefined,
    jobPosition: "",
}

function itemAsEmployee(item: object): EmployeeFields {
    const e = item as Employee;
    return {
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        dateOfBirth: new Date(e.dateOfBirth),
        jobPosition: e.jobPosition,
    };
}

function getDefaultEmployeeFields(defaultItem: object): EmployeeFields {
    return DEFAULT_EMPLOYEE_FIELDS
}

function hasRequiredEmployeeFields(fields: EmployeeFields) {
    return fields.firstName.trim() && fields.lastName.trim()
        && fields.email.trim() && fields.dateOfBirth
        && fields.jobPosition.trim()
}

export default function EmployeeForm(state: FormState) {
    const initialFields =
        state.baseItem ? itemAsEmployee(state.baseItem) :
            getDefaultEmployeeFields(state.defaultItem)
    const initialDobString =
        initialFields.dateOfBirth ? formatDate(initialFields.dateOfBirth) : ""

    const [dobString, setDobString] = useState(initialDobString);

    const dateStrings: EmployeeDateStrings = {
        dob: dobString,
        setDob: setDobString,
    }

    // Reset date strings
    function reset() {
        setDobString(initialDobString);
    }

    // Create Employee on backend from fields
    async function doSubmit(fields: EmployeeFields) {
        const isUpdate = state.baseItem != null;
        const url = isUpdate
            ? `${import.meta.env.VITE_BACKEND_URL}/api/employee/${state.baseItem.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/employee`;
        const res = await fetch(url, {
            method: isUpdate ? "PUT" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstName: fields.firstName,
                lastName: fields.lastName,
                email: fields.email,
                dateOfBirth: fields.dateOfBirth!.toISOString(),
                jobPosition: fields.jobPosition,
            }),
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.error || (isUpdate ? "Update failed" : "Create failed"));
        }
    }

    return (
        <Form
            state={state}
            initialFields={initialFields}
            createFieldsElement={(props) => (
                // Create employee form specific field elements
                <EmployeeFormFields
                    {...props}
                    dateStrings={dateStrings}
                />
            )}
            submit={doSubmit}
            reset={reset}
            getFieldsError={(fields) => {
                // Show an error if missing fields
                if (!hasRequiredEmployeeFields(fields)) {
                    return "Missing required fields."
                }
            }}
        />
    )
}
