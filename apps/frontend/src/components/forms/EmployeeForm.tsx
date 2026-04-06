import { useState } from "react";

import { Button } from "@/elements/buttons/button.tsx"
import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldSet,
    // FieldLegend,
    // FieldDescription,
} from "@/components/Field.tsx"
import { Input } from "@/elements/input.tsx"
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";

type Employee = {
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    jobPosition: string,
}

export default function EmployeeForm() {
    function addEmployee(employee: Employee) {
        // Doesn't do anything right now (just for show)
        console.log("First Name:", employee.firstName)
        console.log("Last Name:", employee.lastName)
        console.log("Date of Birth:", employee.dateOfBirth)
        console.log("Job Position:", employee.jobPosition)
    }

    return <div className='px-100 pt-20'>
        <h1>Add Employee Form</h1>
        <br/>
        <AddEmployeeForm addEmployee={addEmployee}/>
    </div>
}

type AddEmployeeFormProps = {
    addEmployee: (newEmployee: Employee) => void
}
function AddEmployeeForm(props: AddEmployeeFormProps) {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
    const [dateOfBirthString, setDateOfBirthString] = useState<string>("")
    const [jobPosition, setJobPosition] = useState("")

    function reset() {
        setFirstName("")
        setLastName("")
        setDateOfBirth(undefined)
        setDateOfBirthString("")
        setJobPosition("")
    }

    return (
        <form onReset={(e) => {
            e.preventDefault()
            reset()
        }} onSubmit={(e) => {
            e.preventDefault()
            if (firstName.trim() && lastName.trim() && dateOfBirth != null && jobPosition) {
                props.addEmployee({
                    firstName, lastName, dateOfBirth, jobPosition
                })
                reset()
            }
        }}>
            <FieldGroup>
                <FieldSet>
                    {/*<FieldLegend>Add employee form</FieldLegend>*/}
                    {/*<FieldDescription>Example description</FieldDescription>*/}
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor={"employee-add-form-first-name"}>First Name</FieldLabel>
                            <Input
                                id={"employee-add-form-first-name"}
                                placeholder={"First Name"}
                                value={firstName}
                                onChange={(e) =>
                                    setFirstName(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-add-form-last-name"}>Last Name</FieldLabel>
                            <Input
                                id={"employee-add-form-last-name"}
                                placeholder={"Last Name"}
                                value={lastName}
                                onChange={(e) =>
                                    setLastName(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-add-form-dob"}>Date of Birth</FieldLabel>
                            <DateSelectInput
                                id={"employee-add-form-dob"}
                                placeholder={"Date of Birth"}
                                date={dateOfBirth}
                                setDate={setDateOfBirth}
                                dateString={dateOfBirthString}
                                setDateString={setDateOfBirthString}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-add-form-job-position"}>Job Position</FieldLabel>
                            <JobPositionInput
                                id={"employee-add-form-job-position"}
                                jobPosition={jobPosition}
                                setJobPosition={setJobPosition}
                            />
                        </Field>
                    </FieldGroup>
                </FieldSet>
                <Field orientation={"horizontal"}>
                    <Button type={"button"}>Cancel</Button>
                    <Button type={"reset"}>Reset</Button>
                    <Button type={"submit"}>Submit</Button>
                </Field>
            </FieldGroup>
        </form>
    )
}