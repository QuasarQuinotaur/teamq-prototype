import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/Combobox.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { JOB_POSITION_TYPE_MAP } from "@/components/input/constants.tsx";

export type AssignEmployeeOption = {
  id: number;
  firstName: string;
  lastName: string;
  jobPosition?: string;
};

type AssignEmployeesComboboxProps = {
  employees: AssignEmployeeOption[];
  value: number[];
  onValueChange: (ids: number[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

const POSITION_KEY_TO_LABEL: Record<string, string> = {
  admin: "admin",
  underwriter: "underwriter",
  "business-analyst": "business analyst",
};

function addAllLabel(positionKey: string): string {
  const display = JOB_POSITION_TYPE_MAP[positionKey as keyof typeof JOB_POSITION_TYPE_MAP];
  return display ? `Add all ${display}s` : `Add all ${positionKey}s`;
}

export function AssignEmployeesCombobox({
                                          employees,
                                          value,
                                          onValueChange,
                                          placeholder = "Assign employees…",
                                          emptyText = "No employees found.",
                                          disabled = false,
                                        }: AssignEmployeesComboboxProps) {
  const anchor = useComboboxAnchor();

  const { itemKeys, labelByKey } = React.useMemo(() => {
    const labelByKey: Record<string, string> = {};
    for (const e of employees) {
      labelByKey[String(e.id)] = `${e.firstName} ${e.lastName}`.trim();
    }
    return { itemKeys: Object.keys(labelByKey), labelByKey };
  }, [employees]);

  const stringValue = value.map(String);

  const addAllGroups = React.useMemo(() => {
    const groups: { key: string; ids: number[] }[] = [];

    for (const positionKey of Object.keys(POSITION_KEY_TO_LABEL)) {
      const needle = POSITION_KEY_TO_LABEL[positionKey];
      const matched = employees.filter(
          (e) => (e.jobPosition ?? "").toLowerCase() === needle
      );
      if (matched.length === 0) continue;

      // Only include IDs that are not yet selected
      const unselected = matched.filter((e) => !value.includes(e.id));
      if (unselected.length === 0) continue;

      groups.push({ key: positionKey, ids: matched.map((e) => e.id) });
    }

    return groups;
  }, [employees, value]);

  function handleAddAll(ids: number[]) {
    const merged = Array.from(new Set([...value, ...ids]));
    onValueChange(merged);
  }

  return (
      <div className="flex flex-col gap-2">
        <Combobox
            multiple
            autoHighlight
            items={itemKeys}
            value={stringValue}
            onValueChange={(next) => onValueChange(next.map(Number))}
            disabled={disabled}
        >
          <ComboboxChips ref={anchor} className="w-full min-w-[12rem]">
            <ComboboxValue>
              <>
                {stringValue.map((idStr) => (
                    <ComboboxChip key={idStr}>{labelByKey[idStr] ?? idStr}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                    placeholder={value.length === 0 ? placeholder : ""}
                    disabled={disabled}
                />
              </>
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {labelByKey[item]}
                  </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {/* "Add all …" shortcut buttons — only rendered when there are unselected employees in that group */}
        {addAllGroups.length > 0 && !disabled ? (
            <div className="flex flex-wrap gap-1.5">
              {addAllGroups.map(({ key, ids }) => (
                  <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs text-muted-foreground"
                      onClick={() => handleAddAll(ids)}
                      disabled={disabled}
                  >
                    {addAllLabel(key)}
                  </Button>
              ))}
            </div>
        ) : null}
      </div>
  );
}
