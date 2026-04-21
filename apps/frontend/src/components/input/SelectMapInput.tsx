
import * as React from "react";
import type {ComponentProps} from "react";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/elements/select.tsx";

type SelectMapInputProps = ComponentProps<typeof SelectTrigger> & {
    map: {[key: string]: string};
    initValue: string;
    setValue: (contentType: string) => void;
    placeholder?: string;
}
export default function SelectMapInput({
                                           map,
                                           initValue,
                                           setValue,
                                           placeholder,
                                           ...props
}: SelectMapInputProps) {
    return (
        <Select value={initValue} onValueChange={setValue}>
            <SelectTrigger {...props}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
                    {Object.entries(map).map(([key, value]) => (
                        <SelectItem value={key}>{value}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}