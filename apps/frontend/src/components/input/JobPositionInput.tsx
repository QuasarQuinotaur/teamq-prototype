import type {ComponentProps} from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx"
import {JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";

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
                    {Object.entries(JOB_POSITION_TYPE_MAP).map(([key, value]) => (
                        <SelectItem value={key}>{value}</SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

export default JobPositionInput