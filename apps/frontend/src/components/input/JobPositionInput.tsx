

import {JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";
import * as React from "react";
import type {ComponentProps} from "react";
import {SelectTrigger} from "@/elements/select.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";

type JobPositionInputProps = {
    jobPosition: string;
    setJobPosition: (jobPosition: string) => void;
} & ComponentProps<typeof SelectTrigger>
export default function JobPositionInput({
                                             jobPosition,
                                             setJobPosition,
                                             ...props
}: JobPositionInputProps) {
    return (
        <SelectMapInput
            map={JOB_POSITION_TYPE_MAP}
            initValue={jobPosition}
            setValue={setJobPosition}
            placeholder={"Choose job position"}
            {...props}
        />
    )
}