

import * as React from "react";
import type {ComponentProps} from "react";
import {SelectTrigger} from "@/elements/select.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";
import { id } from "date-fns/locale";
import useJobNameMap from "@/hooks/useJobNameMap";

type JobPositionInputProps = {
    jobPosition: string;
    setJobPosition: (jobPosition: string) => void;
} & ComponentProps<typeof SelectTrigger>
export default function JobPositionInput({
                                             jobPosition,
                                             setJobPosition,
                                             ...props
}: JobPositionInputProps) {
    const jobNameMap = useJobNameMap();
    return (
        <SelectMapInput
            map={jobNameMap}
            initValue={jobPosition}
            setValue={setJobPosition}
            placeholder={"Choose job position"}
            {...props}
        />
    )
}