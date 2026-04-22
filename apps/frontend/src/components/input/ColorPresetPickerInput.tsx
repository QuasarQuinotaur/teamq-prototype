import {Button} from "@/elements/buttons/button.tsx";
import {useState} from "react";
import {cn, formatHex} from "@/lib/utils.ts";


export type PresetColor = {
    color: string,
    name?: string,
}

type ColorPresetButtonProps = {
    isSelected: boolean,
    onSelect: () => void,
    preset?: PresetColor,
}
function ColorPresetButton({
                               isSelected,
                               onSelect,
                               preset
}: ColorPresetButtonProps) {
    const [isHovered, setIsHovered] = useState(false)
    const color = preset && preset.color

    return (
        <div
            className={cn(
                `w-full h-full rounded-full bg-transparent flex items-center
                justify-center self-start`,
                isSelected && "outline-4 outline-input p-0.5"
            )}
            style={color && {
                // outlineColor: "bg-",
            }}
        >
            <Button
                variant={"ghost"}
                className={cn(
                    "w-full aspect-square h-auto! rounded-full flex items-center justify-center p-0 self-start",
                    isHovered && "brightness-60",
                )}
                style={color && {
                    backgroundColor: color
                }}
                type={"button"}
                title={preset && preset.name}
                onClick={onSelect}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
            </Button>
        </div>
    )
}

export type ColorPresetPickerInputProps = {
    presetColors: PresetColor[],
    color: string,
    setColor: (color: string) => void,
    id?: string,
}
export default function ColorPresetPickerInput({
                                                   presetColors,
                                                   color,
                                                   setColor,
                                                   id,
}: ColorPresetPickerInputProps) {
    const selectedHex = formatHex(color)

    function getPresetButton(preset: PresetColor) {
        const presetHex = formatHex(preset.color)
        return (
            <ColorPresetButton
                preset={preset}
                isSelected={selectedHex === presetHex}
                onSelect={() => setColor(presetHex)}
            />
        )
    }

    return (
        <div className={"grid gap-2 justify-center grid-cols-[repeat(auto-fit,48px)]"}>
            {presetColors.map(getPresetButton)}

            {/*TODO Support for custom color picking here*/}
            {/*<ColorPresetButton selectedHex={selectedHex}/>*/}
        </div>
    )
}