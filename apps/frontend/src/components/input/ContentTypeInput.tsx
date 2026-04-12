import type {ComponentProps} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx"
import {CONTENT_TYPE_MAP} from "@/components/input/constants.tsx";

type ContentTypeInputProps = {
    contentType: string;
    setContentType: (contentType: string) => void;
} & ComponentProps<typeof SelectTrigger>
export default function ContentTypeInput({
                                             contentType,
                                             setContentType,
                                             ...props
}: ContentTypeInputProps) {

    return (
        <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger {...props}>
                <SelectValue placeholder="Choose content type" />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
                    {Object.entries(CONTENT_TYPE_MAP).map(([key, value]) => (
                        <SelectItem value={key}>{value}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}