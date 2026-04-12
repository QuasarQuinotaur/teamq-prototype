import  {type ComponentProps} from "react";
import * as React from "react";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList, ComboboxValue, useComboboxAnchor
} from "@/components/Combobox.tsx";
import {JOB_POSITION_TYPE_MAP} from "@/components/input/constants.tsx";


type JobPositionProps = {
    jobPositions: string[];
    setJobPositions: (jobPositions: string[]) => void;
} & ComponentProps<typeof ComboboxChipsInput>

function JobPositionCombobox({
                                 jobPositions,
                                 setJobPositions,
                                 ...props
}: JobPositionProps) {
    const anchor = useComboboxAnchor()
    const positions = Object.keys(JOB_POSITION_TYPE_MAP)

    return (
        <Combobox
            multiple
            autoHighlight
            items={positions}
            defaultValue={jobPositions}
            onValueChange={(values) => {
                console.log("NEW VALUES:", values)
                setJobPositions(values)
            }}
        >
            <ComboboxChips ref={anchor} className="w-full max-w-xs">
                <ComboboxValue>
                    {(values: string[]) => (
                        <>
                            {values.map((value: string) => (
                                <ComboboxChip key={value}>
                                    {JOB_POSITION_TYPE_MAP[value]}
                                </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                                placeholder={values.length === 0 ? "Job Position" : ""}
                                {...props}
                            />
                        </>
                    )}
                </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {JOB_POSITION_TYPE_MAP[item]}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}


function JobPositionInput(props: JobPositionProps) {
    return (
        <JobPositionCombobox {...props}/>
    )
}

export default JobPositionInput