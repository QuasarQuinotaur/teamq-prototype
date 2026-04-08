import * as React from "react";
import { useState } from "react";

import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldSet,
} from "@/components/Field.tsx"
import { Input } from "@/elements/input.tsx"
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import DocumentStatusInput from "@/components/input/DocumentStatusInput.tsx";
import { ScrollArea } from "@/elements/scroll-area.tsx";
import type { Content } from "db";
import { formatDate } from "@/lib/utils.ts";
import {type FormProps, FormWindowActions} from "@/components/forms/Form.tsx";
import {
    Dialog as AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/AlertDialog.tsx";


type Document = {
    name: string,
    link: string,
    jobPosition: string,
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
    status: string,
    file: File | null,
    isSubmitting: boolean,
}
const DEFAULT_DOCUMENT = {
    name: "",
    link: "",
    jobPosition: "",
    lastModifiedDate: undefined,
    expirationDate: undefined,
    contentType: "",
    status: "",
    file: null,
    isSubmitting: false,
}

function hasDocumentFields(doc: Document) {
    return doc.name.trim() && doc.jobPosition.trim()
        && doc.expirationDate && doc.contentType.trim()
        && doc.status.trim() && (doc.file || doc.link.trim())
}

function documentHandleKeyChange<T extends keyof Document>(
    setDocument: React.Dispatch<React.SetStateAction<Document>>,
    name: T, value: Document[T]
) {
    setDocument((prev) => ({
        ...prev,
        [name]: value
    }))
}

type DocumentDateStrings = {
    lastModified: string,
    setLastModified: (lastModified: string) => void,
    expiration: string,
    setExpiration: (expirationDate: string) => void,
}
type DocumentFieldsProps = {
    document: Document,
    setDocument: React.Dispatch<React.SetStateAction<Document>>,
    dateStrings: DocumentDateStrings
}
function DocumentFormFields({
    document, setDocument, dateStrings
}: DocumentFieldsProps) {
    function handleKeyChange<T extends keyof Document>(name: T, value: Document[T]) {
        documentHandleKeyChange(setDocument, name, value)
    }

    return (
        <FieldSet>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-name"}>Document Name</FieldLabel>
                    <Input
                        id={"document-add-form-name"}
                        placeholder={"Name"}
                        value={document.name}
                        onChange={(e) => {
                            handleKeyChange("name", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="document-add-form-file">Document File</FieldLabel>
                    {/*TODO: Needs to clear when form is reset*/}
                    <Input
                        id="document-add-form-file"
                        type="file"
                        onChange={(e) => {
                            handleKeyChange("file", e.target.files?.[0] ?? null)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-link"}>Document Link</FieldLabel>
                    <Input
                        id={"document-add-form-link"}
                        placeholder={"https://..."}
                        type={"url"}
                        value={document.link}
                        onChange={(e) => {
                            handleKeyChange("link", e.target.value)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-job-position"}>Job Position</FieldLabel>
                    <JobPositionInput
                        id={"document-add-form-job-position"}
                        jobPosition={document.jobPosition}
                        setJobPosition={(position) => {
                            handleKeyChange("jobPosition", position)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-last-modified"}>Last Modified Date</FieldLabel>
                    <DateSelectInput
                        id={"document-add-form-last-modified"}
                        placeholder={"Last Modified Date"}
                        date={document.lastModifiedDate}
                        setDate={(date) => {
                            handleKeyChange("lastModifiedDate", date)
                        }}
                        dateString={dateStrings.lastModified}
                        setDateString={dateStrings.setLastModified}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-expiration"}>Expiration Date</FieldLabel>
                    <DateSelectInput
                        id={"document-add-form-expiration"}
                        placeholder={"Expiration Date"}
                        date={document.expirationDate}
                        setDate={(date) => {
                            handleKeyChange("expirationDate", date)
                        }}
                        dateString={dateStrings.expiration}
                        setDateString={dateStrings.setExpiration}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-content-type"}>Content Type</FieldLabel>
                    <ContentTypeInput
                        id={"document-add-form-content-type"}
                        contentType={document.contentType}
                        setContentType={(type) => {
                            handleKeyChange("contentType", type)
                        }}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={"document-add-form-status"}>Document Status</FieldLabel>
                    <DocumentStatusInput
                        id={"document-add-form-status"}
                        status={document.status}
                        setStatus={(status) => {
                            handleKeyChange("status", status)
                        }}
                    />
                </Field>
            </FieldGroup>
        </FieldSet>
    )
}


function contentAsDocument(content: Content): Document {
    console.log("Content:", content)
    return {
        name: content.title,
        link: content.link,
        jobPosition: content.jobPosition,
        lastModifiedDate: content.dateUpdated,
        expirationDate: content.expirationDate,
        contentType: content.contentType,
        status: content.status,
        file: null,
        isSubmitting: false,
    }
}

function DocumentForm({
                          fromItem, ...actionProps
}: FormProps) {
    const [document, setDocument] = useState<Document>(
        fromItem ? contentAsDocument(fromItem as Content) : DEFAULT_DOCUMENT
    )
    const [confirmOpen, setConfirmOpen] = useState(false)

    const [lastModifiedString, setLastModifiedString] = useState<string>(
        document.lastModifiedDate ? formatDate(document.lastModifiedDate) : ""
    );
    const [expirationString, setExpirationString] = useState<string>(
        document.expirationDate ? formatDate(document.expirationDate) : ""
    );


    const dateStrings: DocumentDateStrings = {
        lastModified: lastModifiedString,
        setLastModified: setLastModifiedString,
        expiration: expirationString,
        setExpiration: setExpirationString,
    };

    function reset() {
        setDocument(DEFAULT_DOCUMENT);
        setLastModifiedString("");
        setExpirationString("");
    }

    async function doSubmit() {
        try {
            documentHandleKeyChange(setDocument, "isSubmitting", true);

            const formData = new FormData();
            formData.append("name", document.name);
            formData.append("jobPosition", document.jobPosition);
            formData.append("expirationDate", (
                (typeof document.expirationDate  == "string") ? document.expirationDate
                    : (document.expirationDate as Date).toISOString()
            ));
            formData.append("contentType", document.contentType);
            formData.append("status", document.status);
            if (document.file) {
                formData.append("file", document.file);
            } else {
                formData.append("link", document.link.trim());
            }

            let response: Response
            if (fromItem) {
                const deleteResponse = await fetch(`http://localhost:3000/content/${(fromItem as {id: number}).id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                if (!deleteResponse.ok) {
                    throw new Error("Update delete failed");
                }
                response = await fetch("http://localhost:3000/upload", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });
            } else {
                response = await fetch("http://localhost:3000/upload", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Upload failed");
            }
            if (actionProps.onCancel) {
                actionProps.onCancel()
            }

            reset();
        } catch (error) {
            console.error("Submit failed:", error);
        } finally {
            documentHandleKeyChange(setDocument, "isSubmitting", false);
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!hasDocumentFields(document)) {
            console.error("Missing required fields");
            return;
        }

        if (fromItem) {
            setConfirmOpen(true);
        } else {
            doSubmit();
        }
    }

    return (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <form
                onReset={(e) => {
                    e.preventDefault()
                    reset()
                }}
                onSubmit={handleSubmit}
            >
                <ScrollArea className={"h-78 w-90 pr-4 mb-4"}>
                    <FieldGroup className={"p-1"}>
                        <DocumentFormFields
                            document={document}
                            setDocument={setDocument}
                            dateStrings={dateStrings}
                        />
                    </FieldGroup>
                </ScrollArea>
                <FormWindowActions
                    isSubmitting={document.isSubmitting}
                    {...actionProps}
                />
            </form>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will save your changes.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setConfirmOpen(false); doSubmit(); }}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export {
    DocumentForm
}