import {CONTENT_TYPE_MAP} from "@/components/input/constants.tsx";
import * as React from "react";
import type {ComponentProps} from "react";
import {SelectTrigger} from "@/elements/select.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";

type ContentTypeInputProps = {
    contentType: string;
    setContentType: (contentType: string) => void;
    lockSelect?: boolean;
} & ComponentProps<typeof SelectTrigger>
function ContentTypeInput({
                                             contentType,
                                             setContentType,
                                             ...props
}: ContentTypeInputProps) {
    return (
        <SelectMapInput
            map={CONTENT_TYPE_MAP}
            initValue={contentType}
            setValue={setContentType}
            placeholder={"Choose content type"}
            {...props}
        />
    )
}

export default React.memo(ContentTypeInput)
