import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionMultiInput from "@/components/input/JobPositionMultiInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {FileIcon, LinkIcon} from "lucide-react";

export type ContentFields = {
    name: string,
    link: string,
    jobPosition: string,
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
    status: string,
    file: File | null,
    sourceType: "file" | "link",
}
export type DocumentDateStrings = {
    expiration: string,
    setExpiration: (expirationDate: string) => void,
}
type DocumentFormFieldsProps = {
    dateStrings: DocumentDateStrings
    isUpdate: boolean
    existingFileName: string | null
} & FormFieldsProps<ContentFields>
export default function DocumentFormFields({
                                fields,
                                setKey,
                                dateStrings,
                                isUpdate,
                                existingFileName,
}: DocumentFormFieldsProps) {
    function switchToFile() {
        setKey("sourceType", "file")
        setKey("link", "")
    }

    function switchToLink() {
        setKey("sourceType", "link")
        setKey("file", null)
    }

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
                id={"document-add-form-source"}
                label={fields.sourceType === "file"
                    ? (isUpdate ? "Replace File (optional)" : "Document File")
                    : "Document URL"}
                createElement={(id) => (
                    <div className={"flex flex-col gap-1"}>
                        {fields.sourceType === "file" && existingFileName && (
                            <p className={"text-xs text-muted-foreground"}>
                                Current file: {existingFileName}
                            </p>
                        )}
                        <div className={"flex items-center gap-1"}>
                            {fields.sourceType === "file" ? (
                                <Input
                                    id={id}
                                    type={"file"}
                                    onChange={(e) => {
                                        setKey("file", e.target.files?.[0] ?? null)
                                    }}
                                />
                            ) : (
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
                            <Button
                                type={"button"}
                                variant={"outline"}
                                size={"icon"}
                                title={fields.sourceType === "file" ? "Switch to URL" : "Switch to file upload"}
                                onClick={fields.sourceType === "file" ? switchToLink : switchToFile}
                            >
                                {fields.sourceType === "file"
                                    ? <LinkIcon size={16} />
                                    : <FileIcon size={16} />}
                            </Button>
                        </div>
                    </div>
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
        </>
    )
}