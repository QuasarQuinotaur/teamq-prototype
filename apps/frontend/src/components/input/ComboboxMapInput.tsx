import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList,
    ComboboxValue,
    useComboboxAnchor
} from "@/components/Combobox.tsx";
import * as React from "react";
import type {ComponentProps} from "react";


export type ComboboxMapInputProps = {
    map: {[key: string]: string};
    initValues: string[];
    setValues: (newValues: string[]) => void;
    placeholder?: string;
    emptyText?: string;
} & ComponentProps<typeof ComboboxChipsInput>
export default function ComboboxMapInput({
                                             map,
                                             initValues,
                                             setValues,
                                             placeholder,
                                             emptyText,
                                             ...props
}: ComboboxMapInputProps) {
    const anchor = useComboboxAnchor()
    const allItems = Object.keys(map)

    console.log(placeholder, allItems)

    return (
        <Combobox
            multiple
            autoHighlight
            items={allItems}
            defaultValue={initValues}
            onValueChange={(newValues) => {
                setValues(newValues)
            }}
        >
            <ComboboxChips ref={anchor} className="w-full max-w-xs">
                <ComboboxValue>
                    {(values: string[]) => (
                        <>
                            {values.map((value) => (
                                <ComboboxChip key={value}>
                                    {map[value]}
                                </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                                placeholder={(placeholder && values.length === 0) ? placeholder : ""}
                                {...props}
                            />
                        </>
                    )}
                </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
                {emptyText && <ComboboxEmpty>{emptyText}</ComboboxEmpty>}
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {map[item]}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )

}