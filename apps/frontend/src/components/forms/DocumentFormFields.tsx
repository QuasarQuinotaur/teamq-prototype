import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import {Separator} from "@/elements/separator.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionMultiInput from "@/components/input/JobPositionMultiInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {Item} from "@/elements/item.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {FileIcon, LinkIcon} from "lucide-react";
import {cn} from "@/lib/utils.ts";
import {useEffect, useRef, useState} from "react";

export type ContentFields = {
    name: string,
    link: string,
    jobPositions: string[],
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
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
    updateFileResetter: (resetter: () => void) => void
} & FormFieldsProps<ContentFields>
export default function DocumentFormFields({
                                               fields,
                                               setKey,
                                               dateStrings,
                                               isUpdate,
                                               existingFileName,
                                               updateFileResetter
}: DocumentFormFieldsProps) {
    function switchToFile() {
        setKey("sourceType", "file")
        setKey("link", "")
    }

    function switchToLink() {
        setKey("sourceType", "link")
        setKey("file", null)
    }

    // Reference input file to reset the text
    const inputFile = useRef(null);
    useEffect(() => {
        updateFileResetter(() => {
            if (inputFile.current) {
                inputFile.current.value = "";
                inputFile.current.type = "text";
                inputFile.current.type = "file";
            }
        })
    }, [updateFileResetter]);

    const compact = isUpdate
    const inputReadable = cn(compact ? "h-8 text-sm" : "h-9 md:text-base", "min-h-8 w-full min-w-0")

    return (
        <div
            className={cn(
                "max-w-full min-w-0 pl-1 pr-1",
                compact
                    ? "text-sm [&_[data-slot=field]]:gap-2 [&_[data-slot=field-label]]:text-sm [&_[data-slot=field-label]]:font-medium"
                    : "text-base [&_[data-slot=field]]:gap-3 [&_[data-slot=field-label]]:text-base [&_[data-slot=field-label]]:font-medium"
            )}
        >
            <div
                className={cn(
                    "flex flex-col",
                    compact ? "gap-5 sm:gap-6" : "gap-10 sm:gap-12"
                )}
            >
                <section
                    aria-label="Document details"
                    className={cn(
                        "grid min-w-0 grid-cols-1 sm:grid-cols-2",
                        compact ? "gap-4 sm:gap-x-6 sm:gap-y-4" : "gap-7 sm:gap-x-10 sm:gap-y-6"
                    )}
                >
                    <FieldInput
                        id={"document-add-form-name"}
                        label={"Document Name"}
                        required
                        createElement={(id) => (
                            <Input
                                id={id}
                                className={inputReadable}
                                placeholder={"Name"}
                                value={fields.name}
                                onChange={(e) => {
                                    setKey("name", e.target.value)
                                }}
                            />
                        )}
                    />
                    <FieldInput
                        id={"document-add-form-content-type"}
                        label={"Content Type"}
                        required
                        createElement={(id) => (
                            <ContentTypeInput
                                id={id}
                                className={"w-full min-w-0"}
                                contentType={fields.contentType}
                                setContentType={(type) => {
                                    setKey("contentType", type)
                                }}
                            />
                        )}
                    />
                </section>

                <Separator className="bg-border/70" />

                <section aria-label="Document source">
                    <FieldInput
                        id={"document-add-form-source"}
                        label={"Document Source"}
                        required
                        createElement={(id) => (
                            <div className={"flex min-w-0 flex-col gap-2.5 sm:gap-3.5"}>
                                {isUpdate && existingFileName ? (
                                    <div className={"min-h-[2.75rem]"}>
                                        {fields.sourceType === "file" ? (
                                            <div
                                                className={
                                                    "flex min-h-[2.75rem] items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                                                }
                                            >
                                                <FileIcon size={14} className={"shrink-0"} />
                                                <span className={"min-w-0 truncate"}>
                                                    Current:{" "}
                                                    <span className={"font-medium text-foreground"}>
                                                        {existingFileName}
                                                    </span>
                                                </span>
                                            </div>
                                        ) : (
                                            <div
                                                className={"min-h-[2.75rem] rounded-lg border border-transparent"}
                                                aria-hidden
                                            />
                                        )}
                                    </div>
                                ) : null}

                                <div className={"flex min-w-0 items-center gap-2"}>
                                    <div className={"min-w-0 flex-1"}>
                                        {fields.sourceType === "file" ? (
                                            <Input
                                                id={id}
                                                className={inputReadable}
                                                type={"file"}
                                                ref={inputFile}
                                                onChange={(e) => {
                                                    setKey("file", e.target.files?.[0] ?? null)
                                                }}
                                            />
                                        ) : (
                                            <Input
                                                id={id}
                                                className={inputReadable}
                                                placeholder={"https://..."}
                                                type={"url"}
                                                value={fields.link}
                                                onChange={(e) => {
                                                    setKey("link", e.target.value)
                                                }}
                                            />
                                        )}
                                    </div>
                                    <Item
                                        variant={"outline"}
                                        role={"group"}
                                        aria-label={"Document source type"}
                                        className={
                                            "w-fit max-w-none shrink-0 gap-0 overflow-hidden p-0 flex-nowrap"
                                        }
                                    >
                                        <Button
                                            type={"button"}
                                            variant={
                                                fields.sourceType === "file"
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size={compact ? "icon" : "icon-lg"}
                                            className={"rounded-none border-0 shadow-none"}
                                            aria-pressed={fields.sourceType === "file"}
                                            aria-label={"File upload"}
                                            title={"File upload"}
                                            onClick={() => {
                                                if (fields.sourceType !== "file") {
                                                    switchToFile()
                                                }
                                            }}
                                        >
                                            <FileIcon className={"size-4"} />
                                        </Button>
                                        <Button
                                            type={"button"}
                                            variant={
                                                fields.sourceType === "link"
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size={compact ? "icon" : "icon-lg"}
                                            className={"rounded-none border-0 shadow-none"}
                                            aria-pressed={fields.sourceType === "link"}
                                            aria-label={"External URL"}
                                            title={"External URL"}
                                            onClick={() => {
                                                if (fields.sourceType !== "link") {
                                                    switchToLink()
                                                }
                                            }}
                                        >
                                            <LinkIcon className={"size-4"} />
                                        </Button>
                                    </Item>
                                </div>
                            </div>
                        )}
                    />
                </section>

                <Separator className="bg-border/70" />

                <section
                    aria-label="Scheduling"
                    className={cn(
                        "grid min-w-0 grid-cols-1 sm:grid-cols-2",
                        compact ? "gap-4 sm:gap-x-6 sm:gap-y-4" : "gap-7 sm:gap-x-10 sm:gap-y-6"
                    )}
                >
                    <FieldInput
                        id={"document-add-form-job-positions"}
                        label={"Job Positions"}
                        required
                        createElement={(id) => (
                            <JobPositionMultiInput
                                id={id}
                                jobPositions={fields.jobPositions}
                                setJobPositions={(positions) => {
                                    setKey("jobPositions", positions)
                                }}
                            />
                        )}
                    />
                    <FieldInput
                        id={"document-add-form-expiration"}
                        label={"Expiration Date"}
                        required
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
                </section>
            </div>
        </div>
    )
}