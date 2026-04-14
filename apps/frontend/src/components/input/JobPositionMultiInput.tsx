import * as React from "react";
import {JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";
import ComboboxMapInput, {type ComboboxMapInputProps} from "@/components/input/ComboboxMapInput.tsx";
import type {ComponentProps} from "react";
import {ComboboxChipsInput} from "@/components/Combobox.tsx";


type JobPositionInputProps = {
    jobPositions: string[];
    setJobPositions: (jobPositions: string[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>
export default function JobPositionMultiInput(props: JobPositionInputProps) {
    return (
        <ComboboxMapInput
            map={JOB_POSITION_TYPE_MAP}
            values={props.jobPositions}
            setValues={props.setJobPositions}
            placeholder={"Job Position"}
            emptyText={"No positions found."}
            {...props}
        />
    )
}