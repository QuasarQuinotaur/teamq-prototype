import { useState } from "react";
import { Button } from "@/components/ui/button.tsx"
import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldSet,
    FieldLegend,
    FieldDescription,
} from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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
        <h1>Employee Form</h1>
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
    const [dateOpen, setDateOpen] = useState(false)
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
    const [jobPosition, setJobPosition] = useState("")

    function reset() {
        setFirstName("")
        setLastName("")
        setDateOfBirth(undefined)
        setJobPosition("")
    }

    return (
        <form onReset={(e) => {
            e.preventDefault()
            reset()
        }} onSubmit={(e) => {
            e.preventDefault()
            if (dateOfBirth != null) {
                props.addEmployee({
                    firstName, lastName, dateOfBirth, jobPosition
                })
                reset()
            }
        }}>
            <FieldGroup>
                <FieldSet>
                    <FieldLegend>Add employee form</FieldLegend>
                    <FieldDescription>Example description</FieldDescription>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor={"employee-form-first-name"}>First Name</FieldLabel>
                            <Input
                                id={"employee-form-first-name"}
                                placeholder={"First Name"}
                                value={firstName}
                                onChange={(e) =>
                                    setFirstName(e.target.value)}
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-form-last-name"}>Last Name</FieldLabel>
                            <Input
                                id={"employee-form-last-name"}
                                placeholder={"Last Name"}
                                value={lastName}
                                onChange={(e) =>
                                    setLastName(e.target.value)}
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-form-dob"}>Date of Birth</FieldLabel>
                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                <PopoverTrigger asChild id={"employee-form-dob"}>
                                    <Button
                                        variant="outline"
                                        id="date"
                                        className="justify-start font-normal"
                                    >
                                        {dateOfBirth ? dateOfBirth.toLocaleDateString() : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateOfBirth}
                                        defaultMonth={dateOfBirth}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setDateOfBirth(date)
                                            setDateOpen(false)
                                        }}
                                        required
                                    />
                                </PopoverContent>
                            </Popover>
                        </Field>
                        <Field aria-hidden={false}>
                            <FieldLabel htmlFor={"employee-form-job-position"}>Job Position</FieldLabel>
                            <Select value={jobPosition} onValueChange={setJobPosition} required>
                                <SelectTrigger id={"employee-form-job-position"}>
                                    <SelectValue placeholder="Choose job position" />
                                </SelectTrigger>
                                <SelectContent position={"popper"}>
                                    <SelectGroup>
                                        <SelectItem value="underwriter">
                                            Underwriter
                                        </SelectItem>
                                        <SelectItem value="business-analyst">
                                            Business Analyst
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
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