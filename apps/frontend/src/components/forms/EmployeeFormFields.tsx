
import {FieldInput} from "@/components/forms/Field.tsx";
import {Input} from "@/elements/input.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import {Separator} from "@/elements/separator.tsx";
import {cn} from "@/lib/utils.ts";

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
        <div className="max-w-full min-w-0 pl-1 pr-1 flex flex-col gap-5">
            <FieldInput
                id={"employee-form-first-name"}
                label={"First Name"}
                required
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
                required
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
                required
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
                required
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
                required
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
        </div>
    )
}