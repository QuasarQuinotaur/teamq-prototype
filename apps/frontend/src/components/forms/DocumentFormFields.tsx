import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import {Separator} from "@/elements/separator.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionMultiInput from "@/components/input/JobPositionMultiInput.tsx";
import EmployeeCombobox from "@/components/input/EmployeeCombobox.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {Item} from "@/elements/item.tsx";
import {Button} from "@/elements/buttons/button.tsx";
import {FileIcon, LinkIcon} from "lucide-react";
import {cn} from "@/lib/utils.ts";
import {useCallback, useEffect, useRef, type ChangeEvent} from "react";
import type {Employee} from "db";
import { TutorialDocumentStepPanel } from "@/components/tutorial/TutorialDocumentStepPanel.tsx";

export type ContentFields = {
    name: string,
    link: string,
    jobPositions: string[],
    lastModifiedDate: Date | undefined,
    expirationDate: Date | undefined,
    contentType: string,
    file: File | null,
    sourceType: "file" | "link",
    newOwnerID: number,
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
    showTutorialCallouts?: boolean
    /** Tutorial: prefilled fields are not editable; Save still works. */
    fieldsReadOnly?: boolean
} & FormFieldsProps<ContentFields>
export default function DocumentFormFields({
                                               fields,
                                               setKey,
                                               dateStrings,
                                               isUpdate,
                                               existingFileName,
                                               updateFileResetter,
                                               showTutorialCallouts,
                                               fieldsReadOnly,
}: DocumentFormFieldsProps) {
    const switchToFile = useCallback(() => {
        setKey("sourceType", "file")
        setKey("link", "")
    }, [setKey])

    const switchToLink = useCallback(() => {
        setKey("sourceType", "link")
        setKey("file", null)
    }, [setKey])

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (fieldsReadOnly) return;
        setKey("name", e.target.value)
    }, [fieldsReadOnly, setKey])

    const onContentTypeChange = useCallback((type: string) => {
        if (fieldsReadOnly) return;
        setKey("contentType", type)
    }, [fieldsReadOnly, setKey])

    const onOwnerChange = useCallback((owner: Employee) => {
        if (fieldsReadOnly) return;
        setKey("newOwnerID", owner.id)
    }, [fieldsReadOnly, setKey])

    const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (fieldsReadOnly) return;
        setKey("file", e.target.files?.[0] ?? null)
    }, [fieldsReadOnly, setKey])

    const onLinkChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (fieldsReadOnly) return;
        setKey("link", e.target.value)
    }, [fieldsReadOnly, setKey])

    const onJobPositionsChange = useCallback((positions: string[]) => {
        if (fieldsReadOnly) return;
        setKey("jobPositions", positions)
    }, [fieldsReadOnly, setKey])

    const onExpirationDateChange = useCallback((date: Date | undefined) => {
        if (fieldsReadOnly) return;
        setKey("expirationDate", date)
    }, [fieldsReadOnly, setKey])

    const onExpirationStringChange = useCallback((s: string) => {
        if (fieldsReadOnly) return;
        dateStrings.setExpiration(s)
    }, [fieldsReadOnly, dateStrings])

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

    const compact = false
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
                    compact ? "gap-5 sm:gap-6" : "gap-6 sm:gap-8"
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
                                readOnly={fieldsReadOnly}
                                aria-readonly={fieldsReadOnly || undefined}
                                onChange={onNameChange}
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
                                lockSelect={fieldsReadOnly}
                                setContentType={onContentTypeChange}
                            />
                        )}
                    />
                    <FieldInput
                        id={"document-owner"}
                        label={"Document Owner"}
                        required
                        createElement={() => (
                            <EmployeeCombobox
                                isUpdate={isUpdate}
                                ownerID={fields.newOwnerID}
                                disabled={fieldsReadOnly}
                                setNewOwner={onOwnerChange}
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
                                                disabled={fieldsReadOnly}
                                                onChange={onFileChange}
                                            />
                                        ) : (
                                            <Input
                                                id={id}
                                                className={inputReadable}
                                                placeholder={"https://..."}
                                                type={"url"}
                                                value={fields.link}
                                                readOnly={fieldsReadOnly}
                                                aria-readonly={fieldsReadOnly || undefined}
                                                onChange={onLinkChange}
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
                                                if (fieldsReadOnly) return;
                                                if (fields.sourceType !== "file") {
                                                    switchToFile()
                                                }
                                            }}
                                            disabled={fieldsReadOnly}
                                        >
                                            <FileIcon className={"size-4"} />
                                        </Button>
                                        <Button
                                            id="tutorial-5"
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
                                                if (fieldsReadOnly) return;
                                                if (fields.sourceType !== "link") {
                                                    switchToLink()
                                                }
                                            }}
                                            disabled={fieldsReadOnly}
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
                        "flex flex-col gap-4 min-w-0",
                        compact ? "gap-4 sm:gap-x-6 sm:gap-y-4" : "gap-7 sm:gap-x-10 sm:gap-y-6"
                    )}
                >
                    <div className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 min-w-0",
                        compact ? "gap-4 sm:gap-x-6 sm:gap-y-4" : "gap-7 sm:gap-x-10 sm:gap-y-6"
                    )}>

                        <FieldInput
                            id={"document-add-form-job-positions"}
                            label={"Job Positions"}
                            required
                            createElement={(id) => (
                                <JobPositionMultiInput
                                    id={id}
                                    jobPositions={fields.jobPositions}
                                    disabled={fieldsReadOnly}
                                    setJobPositions={onJobPositionsChange}
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
                                    disabled={fieldsReadOnly}
                                    setDate={onExpirationDateChange}
                                    dateString={dateStrings.expiration}
                                    setDateString={onExpirationStringChange}
                                />
                            )}
                        />
                    </div>
                </section>
            </div>
            {showTutorialCallouts ? (
                <TutorialDocumentStepPanel active />
            ) : null}
        </div>
    )
}