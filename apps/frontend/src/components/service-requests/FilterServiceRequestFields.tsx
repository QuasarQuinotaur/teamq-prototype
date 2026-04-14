import * as React from "react";
import type { FormFieldsProps } from "@/components/forms/Form.tsx";
import { FieldInput } from "@/components/forms/Field.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";
import ComboboxMapInput from "@/components/input/ComboboxMapInput.tsx";
import {
  SERVICE_REQUEST_ASSIGNMENT_MAP,
  SERVICE_REQUEST_PRESET_MAP,
  SERVICE_REQUEST_PRIORITY_MAP,
  SERVICE_REQUEST_STATUS_MAP,
} from "@/components/input/constants.tsx";

export type ServiceRequestAssignmentKey = keyof typeof SERVICE_REQUEST_ASSIGNMENT_MAP;
export type ServiceRequestPresetKey = keyof typeof SERVICE_REQUEST_PRESET_MAP;
export type ServiceRequestStatusFilterKey = keyof typeof SERVICE_REQUEST_STATUS_MAP;
export type ServiceRequestPriorityFilterKey = keyof typeof SERVICE_REQUEST_PRIORITY_MAP;

export type ServiceRequestFieldsFilter = {
  assignment: ServiceRequestAssignmentKey;
  preset: ServiceRequestPresetKey;
  statuses: ServiceRequestStatusFilterKey[];
  priorities: ServiceRequestPriorityFilterKey[];
};

export const DEFAULT_SERVICE_REQUEST_FIELDS_FILTER: ServiceRequestFieldsFilter = {
  assignment: "all",
  preset: "all",
  statuses: [],
  priorities: [],
};

export default function FilterServiceRequestFields({
  fields,
  setKey,
}: FormFieldsProps<ServiceRequestFieldsFilter>) {
  return (
    <>
      <FieldInput
        id="filter-sr-assignment"
        label="Assignment"
        createElement={(id) => (
          <SelectMapInput
            id={id}
            map={SERVICE_REQUEST_ASSIGNMENT_MAP}
            initValue={fields.assignment}
            setValue={(v) =>
              setKey("assignment", v as ServiceRequestAssignmentKey)
            }
            placeholder="Assignment"
          />
        )}
      />
      <FieldInput
        id="filter-sr-preset"
        label="Due / progress"
        createElement={(id) => (
          <SelectMapInput
            id={id}
            map={SERVICE_REQUEST_PRESET_MAP}
            initValue={fields.preset}
            setValue={(v) => setKey("preset", v as ServiceRequestPresetKey)}
            placeholder="Due / progress"
          />
        )}
      />
      <FieldInput
        id="filter-sr-status"
        label="By status"
        createElement={(id) => (
          <ComboboxMapInput
            id={id}
            map={SERVICE_REQUEST_STATUS_MAP}
            values={fields.statuses}
            setValues={(v) => setKey("statuses", v)}
            placeholder="Status"
            emptyText="No statuses found."
          />
        )}
      />
      <FieldInput
        id="filter-sr-priority"
        label="By priority"
        createElement={(id) => (
          <ComboboxMapInput
            id={id}
            map={SERVICE_REQUEST_PRIORITY_MAP}
            values={fields.priorities}
            setValues={(v) => setKey("priorities", v)}
            placeholder="Priority"
            emptyText="No priorities found."
          />
        )}
      />
    </>
  );
}
