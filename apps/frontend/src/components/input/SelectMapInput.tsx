
import * as React from "react";
import type {ComponentProps} from "react";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/elements/select.tsx";

type SelectMapInputProps = ComponentProps<typeof SelectTrigger> & {
    map: {[key: string]: string};
    initValue: string;
    setValue: (contentType: string) => void;
    placeholder?: string;
    emptyText?: string;
    lockSelect?: boolean;
}
export default function SelectMapInput({
                                           map,
                                           initValue,
                                           setValue,
                                           placeholder,
                                           emptyText,
                                           lockSelect,
                                           ...props
}: SelectMapInputProps) {
    const entries = Object.entries(map)
    return (
        <Select value={initValue} onValueChange={setValue} disabled={lockSelect}>
            <SelectTrigger {...props}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
                    {entries.length === 0 ? <p className="text-sm p-1">{emptyText}</p> : (
                        entries.map(([key, value]) => (
                            <SelectItem value={key}>{value}</SelectItem>
                        ))
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}