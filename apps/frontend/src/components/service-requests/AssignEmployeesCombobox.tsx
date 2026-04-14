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

export type AssignEmployeeOption = {
  id: number;
  firstName: string;
  lastName: string;
};

type AssignEmployeesComboboxProps = {
  employees: AssignEmployeeOption[];
  value: number[];
  onValueChange: (ids: number[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

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

  return (
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
  );
}
