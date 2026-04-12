// Input that takes a map to supply its values

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList,
    ComboboxValue,
    useComboboxAnchor
} from "@/components/Combobox.tsx";
import * as React from "react";
import {type ComponentProps} from "react";

export type ComboboxMapInputProps<T extends string> = {
    map: {[K in T]: string};
    values: T[];
    setValues: (newValues: T[]) => void;
    placeholder?: string;
    emptyText?: string;
} & ComponentProps<typeof ComboboxChipsInput>
export default function ComboboxMapInput<T extends string>({
                                             map,
                                             values,
                                             setValues,
                                             placeholder,
                                             emptyText,
                                             ...props
}: ComboboxMapInputProps<T>) {
    const anchor = useComboboxAnchor()
    const allItems = Object.keys(map) as T[]

    return (
        <Combobox
            multiple
            autoHighlight
            items={allItems}
            value={values}
            onValueChange={(newValues) => {
                setValues(newValues)
            }}
        >
            <ComboboxChips ref={anchor} className="w-full max-w-xs">
                <ComboboxValue>
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