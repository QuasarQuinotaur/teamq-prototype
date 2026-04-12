import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionMultiInput from "@/components/input/JobPositionMultiInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import DocumentStatusInput from "@/components/input/DocumentStatusInput.tsx";

export type ContentFields = {
    name: string,
    link: string,
    jobPosition: string,
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
    status: string,
    file: File | null,
}
export type DocumentDateStrings = {
    lastModified: string,
    setLastModified: (lastModified: string) => void,
    expiration: string,
    setExpiration: (expirationDate: string) => void,
}
type DocumentFormFieldsProps = {
    dateStrings: DocumentDateStrings
} & FormFieldsProps<ContentFields>
export default function DocumentFormFields({
                                fields,
                                setKey,
                                dateStrings
}: DocumentFormFieldsProps) {
    return (
        <>
            <FieldInput
                id={"document-add-form-name"}
                label={"Document Name"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder={"Name"}
                        value={fields.name}
                        onChange={(e) => {
                            setKey("name", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-file"}
                label={"Document File"}
                createElement={(id) => (
                    // TODO: Needs to clear when form is reset
                    <Input
                        id={id}
                        type={"file"}
                        onChange={(e) => {
                            setKey("file", e.target.files?.[0] ?? null)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-link"}
                label={"Document Link"}
                createElement={(id) => (
                    <Input
                        id={id}
                        placeholder={"https://..."}
                        type={"url"}
                        value={fields.link}
                        onChange={(e) => {
                            setKey("link", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-job-positions"}
                label={"Job Positions"}
                createElement={(id) => (
                    <JobPositionMultiInput
                        id={id}
                        jobPositions={fields.jobPosition.trim() ? [fields.jobPosition] : []}
                        setJobPositions={(positions) => {
                            setKey("jobPosition", positions[0] ?? "")
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-last-modified"}
                label={"Last Modified Date"}
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder={"Last Modified Date"}
                        date={fields.lastModifiedDate}
                        setDate={(date) => {
                            setKey("lastModifiedDate", date)
                        }}
                        dateString={dateStrings.lastModified}
                        setDateString={dateStrings.setLastModified}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-expiration"}
                label={"Expiration Date"}
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder={"Expiration Date"}
                        date={fields.expirationDate}
                        setDate={(date) => {
                            setKey("expirationDate", date)
                        }}
                        dateString={dateStrings.expiration}
                        setDateString={dateStrings.setExpiration}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-content-type"}
                label={"Content Type"}
                createElement={(id) => (
                    <ContentTypeInput
                        id={id}
                        contentType={fields.contentType}
                        setContentType={(type) => {
                            setKey("contentType", type)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"document-add-form-status"}
                label={"Document Status"}
                createElement={(id) => (
                    <DocumentStatusInput
                        id={id}
                        status={fields.status}
                        setStatus={(status) => {
                            setKey("status", status)
                        }}
                    />
                )}
            />
        </>
    )
}