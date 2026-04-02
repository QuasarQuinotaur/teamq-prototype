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
import DateSelectInput from "@/components/forms/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/forms/input/ContentTypeInput.tsx";
import DocumentStatusInput from "@/components/forms/input/DocumentStatusInput.tsx";

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
                            <FieldLabel htmlFor={"document-add-form-name"}>Document Name</FieldLabel>
                            <Input
                                id={"document-add-form-name"}
                                placeholder={"Name"}
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-link"}>Document Link</FieldLabel>
                            <Input
                                id={"document-add-form-link"}
                                placeholder={"https://..."}
                                value={link}
                                onChange={(e) =>
                                    setLink(e.target.value)}
                                type={"url"}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-owner"}>Owner</FieldLabel>
                            <Input
                                id={"document-add-form-owner"}
                                placeholder={"Owner"}
                                value={owner}
                                onChange={(e) =>
                                    setOwner(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-job-position"}>Job Position</FieldLabel>
                            <JobPositionInput
                                id={"document-add-form-job-position"}
                                jobPosition={jobPosition}
                                setJobPosition={setJobPosition}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-last-modified"}>Last Modified Date</FieldLabel>
                            <DateSelectInput
                                id={"document-add-form-last-modified"}
                                placeholder={"Last Modified Date"}
                                date={lastModifiedDate}
                                setDate={setLastModifiedDate}
                                dateString={lastModifiedDateString}
                                setDateString={setLastModifiedDateString}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-expiration"}>Expiration Date</FieldLabel>
                            <DateSelectInput
                                id={"document-add-form-expiration"}
                                placeholder={"Expiration Date"}
                                date={expirationDate}
                                setDate={setExpirationDate}
                                dateString={expirationDateString}
                                setDateString={setExpirationDateString}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-content-type"}>Content Type</FieldLabel>
                            <ContentTypeInput
                                id={"document-add-form-content-type"}
                                contentType={contentType}
                                setContentType={setContentType}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={"document-add-form-status"}>Document Status</FieldLabel>
                            <DocumentStatusInput
                                id={"document-add-form-status"}
                                status={status}
                                setStatus={setStatus}
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