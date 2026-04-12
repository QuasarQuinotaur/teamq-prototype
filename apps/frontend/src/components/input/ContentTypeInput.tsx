import {CONTENT_TYPE_MAP} from "@/components/input/constants.tsx";
import * as React from "react";
import ComboboxMapInput from "@/components/input/ComboboxMapInput.tsx";
import type {ComponentProps} from "react";
import {ComboboxChipsInput} from "@/components/Combobox.tsx";

type ContentTypeInputProps = {
    contentTypes: string[];
    setContentTypes: (contentTypes: string[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>
export default function ContentTypeInput(props: ContentTypeInputProps) {
    return (
        // <Select value={contentType} onValueChange={setContentType}>
        //     <SelectTrigger {...props}>
        //         <SelectValue placeholder="Choose content type" />
        //     </SelectTrigger>
        //     <SelectContent position={"popper"}>
        //         <SelectGroup>
        //             {Object.entries(CONTENT_TYPE_MAP).map(([key, value]) => (
        //                 <SelectItem value={key}>{value}</SelectItem>
        //             ))}
        //         </SelectGroup>
        //     </SelectContent>
        // </Select>
        <ComboboxMapInput
            map={CONTENT_TYPE_MAP}
            initValues={props.contentTypes}
            setValues={props.setContentTypes}
            placeholder={"Content Type"}
            emptyText={"No types found."}
            {...props}
        />
    )
}