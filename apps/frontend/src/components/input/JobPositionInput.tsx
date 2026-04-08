import type {ComponentProps} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx"

type JobPositionProps = {
    jobPosition: string;
    setJobPosition: (jobPosition: string) => void;
} & ComponentProps<typeof SelectTrigger>
function JobPositionInput(
    { jobPosition, setJobPosition, ...props }: JobPositionProps
) {
    return (
        <Select value={jobPosition} onValueChange={setJobPosition}>
            <SelectTrigger {...props}>
                <SelectValue placeholder="Choose job position" />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
                    <SelectItem value="admin">
                        Admin
                    </SelectItem>
                    <SelectItem value="underwriter">
                        Underwriter
                    </SelectItem>
                    <SelectItem value="business-analyst">
                        Business Analyst
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

export default JobPositionInput