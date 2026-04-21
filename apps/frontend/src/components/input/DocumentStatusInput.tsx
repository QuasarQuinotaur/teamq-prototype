import type {ComponentProps} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx"
import {DOCUMENT_STATUS_TYPE_MAP} from "@/components/input/constants.tsx";

type DocumentStatusInputProps = {
    status: string;
    setStatus: (status: string) => void;
} & ComponentProps<typeof SelectTrigger>
export default function DocumentStatusInput(
    { status, setStatus, ...props }: DocumentStatusInputProps
) {
    return (
        <Select value={status} onValueChange={setStatus}>
            <SelectTrigger {...props}>
                <SelectValue placeholder="Choose document status" />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
                    {Object.entries(DOCUMENT_STATUS_TYPE_MAP).map(([key, value]) => (
                        <SelectItem value={key}>{value}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}