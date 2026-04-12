
import {FieldInput} from "@/components/forms/Field.tsx";
import {Input} from "@/elements/input.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import type {FormFieldsProps} from "@/components/forms/Form.tsx";

export type EmployeeFields = {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date | undefined;
    jobPosition: string;
}

export type EmployeeDateStrings = {
    dob: string,
    setDob: (lastDob: string) => void,
}
type EmployeeFormFieldsProps = {
    dateStrings: EmployeeDateStrings,
} & FormFieldsProps<EmployeeFields>
export default function EmployeeFormFields({
                                fields,
                                setKey,
                                dateStrings
                            }: EmployeeFormFieldsProps) {
    return (
        <>
            <FieldInput
                id={"employee-form-first-name"}
                label={"First Name"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder="First Name"
                        value={fields.firstName}
                        onChange={(e) => {
                            setKey("firstName", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"employee-form-last-name"}
                label={"Last Name"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder="Last Name"
                        value={fields.lastName}
                        onChange={(e) => {
                            setKey("lastName", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"employee-form-email"}
                label={"Email"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder="email@example.com"
                        type="email"
                        value={fields.email}
                        onChange={(e) => {
                            setKey("email", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"employee-form-dob"}
                label={"Date of Birth"}
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder="Date of Birth"
                        date={fields.dateOfBirth}
                        setDate={(date) => {
                            setKey("dateOfBirth", date)
                        }}
                        dateString={dateStrings.dob}
                        setDateString={dateStrings.setDob}
                    />
                )}
            />
            <FieldInput
                id={"employee-form-job-position"}
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
        </>
    )
}