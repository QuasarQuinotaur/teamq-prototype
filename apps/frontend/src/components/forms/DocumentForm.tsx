import { useState } from "react";

import { Button } from "@/components/ui/button.tsx"
import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldSet,
    // FieldLegend,
    // FieldDescription,
} from "@/components/ui/field.tsx"
import { Input } from "@/components/ui/input.tsx"
import JobPositionInput from "@/components/forms/input/JobPositionInput.tsx";

type Document = {
    name: string,
    link: string,
    owner: string,
    jobPosition: string,
    lastModifiedDate: Date,
    expirationDate: Date,
    contentType: string,
    status: string,
}

export default function DocumentForm() {
    function addDocument(document: Document) {
        // Doesn't do anything right now (just for show)
        console.log("Name:", document.name)
        console.log("Link:", document.link)
        console.log("Owner:", document.owner)
        console.log("Job Position:", document.jobPosition)
        console.log("Last Modified Date:", document.lastModifiedDate)
        console.log("Expiration Date:", document.expirationDate)
        console.log("Content Type:", document.contentType)
        console.log("Status:", document.status)
    }

    return <div className='px-100 pt-20'>
        <h1>Document Form</h1>
        <br/>
        <AddDocumentForm addDocument={addDocument}/>
    </div>
}

type AddDocumentFormProps = {
    addDocument: (newDocument: Document) => void
}
function AddDocumentForm(props: AddDocumentFormProps) {
    const [name, setName] = useState("")
    const [link, setLink] = useState("")
    const [owner, setOwner] = useState("")
    const [jobPosition, setJobPosition] = useState("")
    const [lastModifiedDate, setLastModifiedDate] = useState<Date | undefined>(undefined)
    const [lastModifiedDateString, setLastModifiedDateString] = useState("")
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
    const [expirationDateString, setExpirationDateString] = useState("")
    const [contentType, setContentType] = useState("")
    const [status, setStatus] = useState("")

    function reset() {
        setName("")
        setLink("")
        setOwner("")
        setJobPosition("")
        setLastModifiedDate(undefined)
        setLastModifiedDateString("")
        setExpirationDate(undefined)
        setExpirationDateString("")
        setContentType("")
        setStatus("")
    }

    return (
        <form onReset={(e) => {
            e.preventDefault()
            reset()
        }} onSubmit={(e) => {
            e.preventDefault()
            if (name.trim() && link.trim() && owner.trim() && jobPosition.trim() &&
                lastModifiedDate != null && expirationDate != null &&
                contentType.trim() && status.trim()
            ) {
                props.addDocument({
                    name, link, owner, jobPosition, lastModifiedDate,
                    expirationDate, contentType, status
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
                            <FieldLabel htmlFor={"document-add-form-name"}>First Name</FieldLabel>
                            <Input
                                id={"document-add-form-name"}
                                placeholder={"Name"}
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-link"}>First Name</FieldLabel>
                            <Input
                                id={"employee-add-form-link"}
                                placeholder={"Link"}
                                value={link}
                                onChange={(e) =>
                                    setLink(e.target.value)}
                                type={"link"}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-owner"}>First Name</FieldLabel>
                            <Input
                                id={"document-add-form-owner"}
                                placeholder={"Owner"}
                                value={owner}
                                onChange={(e) =>
                                    setOwner(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Job Position</FieldLabel>
                            <JobPositionInput
                                id={"document-add-form-job-position"}
                                jobPosition={jobPosition}
                                setJobPosition={setJobPosition}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"employee-form-dob"}>Date of Birth</FieldLabel>
                            <DateOfBirth
                                dateOfBirth={dateOfBirth}
                                setDateOfBirth={setDateOfBirth}
                                dateString={dateString}
                                setDateString={setDateString}
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