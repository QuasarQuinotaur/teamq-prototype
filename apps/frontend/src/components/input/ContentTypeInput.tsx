import type {ComponentProps} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx"

type ContentTypeInputProps = {
    contentType: string;
    setContentType: (contentType: string) => void;
} & ComponentProps<typeof SelectTrigger>
export default function ContentTypeInput(
    { contentType, setContentType, ...props }: ContentTypeInputProps
) {
    return (
        <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger {...props}>
                <SelectValue placeholder="Choose content type" />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
                    <SelectItem value="reference">
                        Reference
                    </SelectItem>
                    <SelectItem value="workflow">
                        Workflow
                    </SelectItem>
                    <SelectItem value="tool">
                        Tool
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}