import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx"

type JobPositionProps = {
    jobPosition: string;
    setJobPosition: (jobPosition: string) => void;
}
function JobPosition({ jobPosition, setJobPosition }: JobPositionProps) {
    return (
        <Select value={jobPosition} onValueChange={setJobPosition}>
            <SelectTrigger
                id={"employee-form-job-position"}
            >
                <SelectValue placeholder="Choose job position" />
            </SelectTrigger>
            <SelectContent position={"popper"}>
                <SelectGroup>
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

export default JobPosition