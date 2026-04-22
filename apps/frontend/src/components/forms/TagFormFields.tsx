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
import ColorPresetPickerInput, {type PresetColor} from "@/components/input/ColorPresetPickerInput.tsx";

const TAG_PRESET_COLORS: PresetColor[] = [
    {color: "#ff0000", name: "Red"},
    {color: "#ff7300", name: "Orange"},
    {color: "#f8d238", name: "Yellow"},
    {color: "#00ff00", name: "Lime"},
    {color: "#009846", name: "Green"},
    {color: "#19e3ff", name: "Cyan"},
    {color: "#0073ff", name: "Blue"},
    {color: "#003473", name: "Navy"},
    {color: "#7300ff", name: "Purple"},
    {color: "#ff00ff", name: "Pink"},
    {color: "#c6006c", name: "Magenta"},
    {color: "#636363", name: "Gray"},
]

export type TagFields = {
    name: string,
    color: string,
}
type TagFormFieldsProps = FormFieldsProps<TagFields>
export default function TagFormFields({
                                          fields,
                                          setKey,
}: TagFormFieldsProps) {
    const compact = false
    const inputReadable = cn(compact ? "h-8 text-sm" : "h-9 md:text-base", "min-h-8 w-full min-w-0")

    return (
        <div className={"flex flex-col gap-6 w-full min-w-0 justify-center"}>
            <FieldInput
                id={"tag-create-form-name"}
                label={"Tag Name"}
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
                id={"tag-create-form-color"}
                label={"Tag Color"}
                required
                createElement={(id) => (
                    <ColorPresetPickerInput
                        id={id}
                        presetColors={TAG_PRESET_COLORS}
                        color={fields.color}
                        setColor={(color) => setKey("color", color)}
                    />
                )}
            />
        </div>
    )
}