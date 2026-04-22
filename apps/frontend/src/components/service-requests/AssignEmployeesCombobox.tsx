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
import { ButtonGroup } from "@/elements/buttons/button-group.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import { JOB_POSITION_TYPE_MAP } from "@/components/input/constants.tsx";
import { ChevronDownIcon } from "lucide-react";

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

function groupLabel(positionKey: string): string {
  return JOB_POSITION_TYPE_MAP[positionKey as keyof typeof JOB_POSITION_TYPE_MAP] ?? positionKey;
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

    for (const positionKey of Object.keys(JOB_POSITION_TYPE_MAP)) {
      const matched = employees.filter(
          (e) => (e.jobPosition ?? "").toLowerCase() === positionKey.toLowerCase()
      );
      if (matched.length === 0) continue;

      const unselected = matched.filter((e) => !value.includes(e.id));
      if (unselected.length === 0) continue;

      groups.push({ key: positionKey, ids: matched.map((e) => e.id) });
    }

    return groups;
  }, [employees, value]);

  // Track which group is selected for the "Add all" split button
  const [selectedGroupKey, setSelectedGroupKey] = React.useState<string | null>(null);

  // Keep selected key valid as groups change (e.g. a group becomes fully selected)
  const activeGroup = addAllGroups.find((g) => g.key === selectedGroupKey) ?? addAllGroups[0] ?? null;

  function handleAddAll() {
    if (!activeGroup) return;
    const merged = Array.from(new Set([...value, ...activeGroup.ids]));
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

        {/* Split button: main action + dropdown to choose which group to add */}
        {activeGroup && !disabled ? (
            <ButtonGroup className="w-fit">
              <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={handleAddAll}
              >
                Add all {groupLabel(activeGroup.key)}s
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="px-1.5 text-muted-foreground"
                      aria-label="Choose group to add"
                  >
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {addAllGroups.map(({ key }) => (
                      <DropdownMenuItem
                          key={key}
                          onSelect={() => setSelectedGroupKey(key)}
                      >
                        {groupLabel(key)}s
                      </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
        ) : null}
      </div>
  );
}
