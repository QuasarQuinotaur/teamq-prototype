import type {ComponentProps} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx"

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
                    <SelectItem value="todo">
                        To-Do
                    </SelectItem>
                    <SelectItem value="in-progress">
                        In-Progress
                    </SelectItem>
                    <SelectItem value="completed">
                        Completed
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}