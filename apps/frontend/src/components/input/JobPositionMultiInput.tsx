import * as React from "react";
import ComboboxMapInput, {type ComboboxMapInputProps} from "@/components/input/ComboboxMapInput.tsx";
import type {ComponentProps} from "react";
import {ComboboxChipsInput} from "@/components/Combobox.tsx";
import useJobNameMap from "@/hooks/useJobNameMap";


type JobPositionInputProps = {
    jobPositions: string[];
    setJobPositions: (jobPositions: string[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>
export default function JobPositionMultiInput(props: JobPositionInputProps) {
    const { jobNameMap, rolesLoading } = useJobNameMap();
    return (
        <ComboboxMapInput
            map={jobNameMap}
            values={props.jobPositions}
            setValues={props.setJobPositions}
            placeholder={"Job Position"}
            emptyText={rolesLoading ? "Loading positions..." : "No positions found."}
            {...props}
        />
    )
}