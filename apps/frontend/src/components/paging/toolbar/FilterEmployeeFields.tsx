// Fields to include in filtering for Employee

import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import ContentTypeInput from "@/components/input/ContentTypeInput.tsx";
import {Input} from "@/elements/input.tsx";
import JobPositionMultiInput from "@/components/input/JobPositionMultiInput.tsx";
import * as React from "react";

export type EmployeeFieldsFilter = {
    jobPositions?: string[];
}

export default function FilterEmployeeFields({
                                                 fields,
                                                 setKey,
}: FormFieldsProps<EmployeeFieldsFilter>) {
    return (
        <>
            <FieldInput
                id={"filter-employees-job-position"}
                label={"By Job Position"}
                createElement={(id) => (
                    <JobPositionMultiInput
                        id={id}
                        jobPositions={fields.jobPositions ?? []}
                        setJobPositions={(positions) => {
                            setKey("jobPositions", positions)
                        }}
                    />
                )}
            />
        </>
    )
}