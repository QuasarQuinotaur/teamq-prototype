// Input that takes a map to supply its values

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxSeparator,
    ComboboxValue,
    useComboboxAnchor
} from "@/components/Combobox.tsx";
import * as React from "react";
import {type ComponentProps} from "react";
import {boolean} from "mathjs";

export type ComboboxEntryProps = {
    isApplied?: boolean,
    isChip?: boolean,
}
export type ComboboxEntry = React.ReactNode | ((props: ComboboxEntryProps) => React.ReactNode)

export type ComboboxMapInputProps<T extends string> = {
    map: {[K in T]: ComboboxEntry};
    values: T[];
    setValues: (newValues: T[]) => void;
    placeholder?: string;
    emptyText?: string;
    footerElement?: React.ReactNode;
} & ComponentProps<typeof ComboboxChipsInput>
export default function ComboboxMapInput<T extends string>({
                                                               map,
                                                               values,
                                                               setValues,
                                                               placeholder,
                                                               emptyText,
                                                               footerElement,
                                                               ...props
}: ComboboxMapInputProps<T>) {
    const anchor = useComboboxAnchor()
    const allItems = Object.keys(map) as T[]

    function getMapNode(value: T, props: ComboboxEntryProps): React.ReactNode {
        const entry: ComboboxEntry = map[value]
        if (typeof entry === "function") {
            return entry(props)
        }
        return entry
    }

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
            <ComboboxChips ref={anchor} className="w-full max-w-full">
                <ComboboxValue>
                    <>
                        {values.map((value) => (
                            <ComboboxChip key={value}>
                                {getMapNode(value, {
                                    isApplied: true,
                                    isChip: true
                                })}
                            </ComboboxChip>
                        ))}
                        <ComboboxChipsInput
                            placeholder={(placeholder && values.length === 0) ? placeholder : ""}
                            {...props}
                        />
                    </>
                </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor} className={"pointer-events-auto"}>
                {emptyText && <ComboboxEmpty>{emptyText}</ComboboxEmpty>}
                <ComboboxList>
                    {(value: T) => (
                        <ComboboxItem key={value} value={value}>
                            {getMapNode(value, {
                                isApplied: values.includes(value)
                            })}
                        </ComboboxItem>
                    )}
                </ComboboxList>
                {footerElement && (
                    <div className={"m-1"}>
                        <ComboboxSeparator/>
                        {footerElement}
                    </div>
                )}
            </ComboboxContent>
        </Combobox>
    )

}