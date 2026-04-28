import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {Field, FieldInput, FieldLabel} from "@/components/forms/Field.tsx";
import {Input} from "@/elements/input.tsx";
import {Switch} from "@/elements/switch.tsx";
import {cn} from "@/lib/utils.ts";
import ColorPresetPickerInput, {type PresetColor} from "@/components/input/ColorPresetPickerInput.tsx";

const TAG_PRESET_COLORS: PresetColor[] = [
    {color: "#fc2c03", name: "Red"},
    {color: "#ff8400", name: "Orange"},
    {color: "#fcdc49", name: "Yellow"},
    {color: "#a6f587", name: "Lime"},
    {color: "#45ed66", name: "Green"},
    {color: "#8bf7fc", name: "Cyan"},
    {color: "#418bf2", name: "Blue"},
    {color: "#4c63e0", name: "Navy"},
    {color: "#964ce0", name: "Purple"},
    {color: "#fc92f9", name: "Pink"},
    {color: "#f51b8b", name: "Magenta"},
    {color: "#636363", name: "Gray"},
]

export type TagFields = {
    name: string,
    color: string,
    isGlobal: boolean,
}
type TagFormFieldsProps = FormFieldsProps<TagFields> & {
    isAdmin?: boolean;
    isCreate: boolean;
}
export default function TagFormFields({
    fields,
    setKey,
    isAdmin,
    isCreate,
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
            {isCreate && isAdmin && (
                <Field orientation="horizontal" className="flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                    <FieldLabel className="text-sm font-medium">Global tag (visible to everyone)</FieldLabel>
                    <Switch
                        checked={fields.isGlobal}
                        onCheckedChange={(v) => setKey("isGlobal", v)}
                        aria-label="Create as global tag"
                    />
                </Field>
            )}
            {!isCreate && fields.isGlobal && (
                <p className="text-sm text-muted-foreground">
                    This tag is organization-wide and visible to everyone.
                </p>
            )}
        </div>
    )
}