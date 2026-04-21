import {CONTENT_TYPE_MAP} from "@/components/input/constants.tsx";
import * as React from "react";
import ComboboxMapInput from "@/components/input/ComboboxMapInput.tsx";
import type {ComponentProps} from "react";
import {ComboboxChipsInput} from "@/components/Combobox.tsx";

type ContentTypeMultiInputProps = {
    contentTypes: string[];
    setContentTypes: (contentTypes: string[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>
export default function ContentTypeMultiInput(props: ContentTypeMultiInputProps) {
    return (
        <ComboboxMapInput
            map={CONTENT_TYPE_MAP}
            values={props.contentTypes}
            setValues={props.setContentTypes}
            placeholder={"Content Type"}
            emptyText={"No types found."}
            {...props}
        />
    )
}