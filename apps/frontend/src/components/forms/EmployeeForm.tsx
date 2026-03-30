import { DateOfBirthPicker } from "@/components/ui/date-picker.tsx"
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

function EmployeeForm() {
    return (
        <div className='px-100 pt-20'>
            <h1>Employee Form</h1>
            <br/>
            <form>
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend>Add employee form</FieldLegend>
                        <FieldDescription>Example description</FieldDescription>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor={"employee-form-first-name"}>First Name</FieldLabel>
                                <Input id={"employee-form-first-name"} placeholder={"First Name"} required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor={"employee-form-last-name"}>Last Name</FieldLabel>
                                <Input id={"employee-form-last-name"} placeholder={"Last Name"} required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor={"employee-form-dob"}>Date of Birth</FieldLabel>
                                <DateOfBirthPicker/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor={"employee-form-job-position"}>Job Position</FieldLabel>
                                <Select required>
                                    <SelectTrigger>
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
                        <Button type={"reset"}>Reset</Button>
                        <Button type={"submit"}>Submit</Button>
                    </Field>
                    {/*<FieldLabel>Date of Birth:</FieldLabel>*/}
                    {/*<DateOfBirthPicker/>*/}
                </FieldGroup>
            </form>
        </div>
    )


    //     <FieldLabel>First Name:</FieldLabel>
    // <Input id={"firstName"} type={"text"}/>
    // <FieldLabel>Last Name:</FieldLabel>
    // <Input id={"lastName"} type={"text"}/>
    // <FieldLabel>Date of Birth:</FieldLabel>
    // <DateOfBirthPicker/>
}
export default EmployeeForm