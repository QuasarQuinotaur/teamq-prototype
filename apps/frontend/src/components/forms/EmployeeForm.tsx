import { useState } from "react";
import { CalendarIcon } from "lucide-react"

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
    InputGroup,
    InputGroupAddon, InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
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

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

type AddEmployeeFormProps = {
    addEmployee: (newEmployee: Employee) => void
}
function AddEmployeeForm(props: AddEmployeeFormProps) {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dateOpen, setDateOpen] = useState(false)
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
    const [dateString, setDateString] = useState<string>("")
    const [jobPosition, setJobPosition] = useState("")

    function reset() {
        setFirstName("")
        setLastName("")
        setDateOfBirth(undefined)
        setDateString("")
        setJobPosition("")
    }

    return (
        <form onReset={(e) => {
            e.preventDefault()
            reset()
        }} onSubmit={(e) => {
            e.preventDefault()
            if (firstName.trim() && lastName.trim() && dateOfBirth != null && jobPosition.trim()) {
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
                            <FieldLabel htmlFor={"employee-form-first-name"}>First Name</FieldLabel>
                            <Input
                                id={"employee-form-first-name"}
                                placeholder={"First Name"}
                                value={firstName}
                                onChange={(e) =>
                                    setFirstName(e.target.value)}
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
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-form-dob"}>Date of Birth</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id={"employee-form-dob"}
                                    value={dateString}
                                    placeholder="Date of Birth"
                                    onChange={(e) => {
                                        console.log(dateString)
                                        const date = new Date(e.target.value)
                                        setDateString(e.target.value)
                                        if (isValidDate(date)) {
                                            setDateOfBirth(date)
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault()
                                            setDateOpen(true)
                                        }
                                    }}
                                />
                                <InputGroupAddon align="inline-end">
                                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                        <PopoverTrigger asChild>
                                            <InputGroupButton
                                                id={"employee-form-dob-picker"}
                                                variant="ghost"
                                                aria-label="Select date"
                                            >
                                                <CalendarIcon /><span className="sr-only">Select date</span>
                                            </InputGroupButton>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dateOfBirth}
                                                defaultMonth={dateOfBirth}
                                                // captionLayout="dropdown"
                                                onSelect={(date) => {
                                                    setDateOfBirth(date)
                                                    setDateString(formatDate(date))
                                                    setDateOpen(false)
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </InputGroupAddon>
                            </InputGroup>
                        </Field>
                        <Field aria-hidden={false}>
                            <FieldLabel htmlFor={"employee-form-job-position"}>Job Position</FieldLabel>
                            <Select value={jobPosition} onValueChange={setJobPosition}>
                                <SelectTrigger
                                    id={"employee-form-job-position"}
                                >
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