// Form for adding employees on backend

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
import {formatDate} from "@/lib/utils.ts";
import type {Employee} from "db";
import Form, {
    type FormFieldsProps,
    type FormState
} from "@/components/forms/Form.tsx";

type EmployeeFields = {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date | undefined;
    jobPosition: string;
}

const DEFAULT_EMPLOYEE_FIELDS: EmployeeFields = {
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: undefined,
    jobPosition: "",
}

type EmployeeDateStrings = {
    dob: string,
    setDob: (lastDob: string) => void,
}
type EmployeeFormFieldsProps = {
    dateStrings: EmployeeDateStrings,
} & FormFieldsProps<EmployeeFields>
function EmployeeFormFields({
                                fields,
                                setKey,
                                dateStrings
}: EmployeeFormFieldsProps) {
    return (
        <FieldSet>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="employee-form-first-name">First Name</FieldLabel>
                    <Input
                        id="employee-form-first-name"
                        placeholder="First Name"
                        value={fields.firstName}
                        onChange={(e) => {
                            setKey("firstName", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="employee-form-last-name">Last Name</FieldLabel>
                    <Input
                        id="employee-form-last-name"
                        placeholder="Last Name"
                        value={fields.lastName}
                        onChange={(e) => {
                            setKey("lastName", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="employee-form-email">Email</FieldLabel>
                    <Input
                        id="employee-form-email"
                        placeholder="email@example.com"
                        type="email"
                        value={fields.email}
                        onChange={(e) => {
                            setKey("email", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="employee-form-dob">Date of Birth</FieldLabel>
                    <DateSelectInput
                        id="employee-form-dob"
                        placeholder="Date of Birth"
                        date={fields.dateOfBirth}
                        setDate={(date) => {
                            setKey("dateOfBirth", date)
                        }}
                        dateString={dateStrings.dob}
                        setDateString={dateStrings.setDob}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="employee-form-job-position">Job Position</FieldLabel>
                    <JobPositionInput
                        id="employee-form-job-position"
                        jobPosition={fields.jobPosition}
                        setJobPosition={(pos) => {
                            setKey("jobPosition", pos)
                        }}
                    />
                </Field>
            </FieldGroup>
        </FieldSet>
    )
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
            ? `${import.meta.env.VITE_BACKEND_URL}/api/employees/${state.baseItem.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/employees`;
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
