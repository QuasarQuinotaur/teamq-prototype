import * as React from "react";
import { Button } from "@/elements/buttons/button.tsx";
import { ButtonGroup } from "@/elements/buttons/button-group.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import { ChevronDownIcon } from "lucide-react";
import useJobNameMap from "@/hooks/useJobNameMap";
import ComboboxMapInput from "../input/ComboboxMapInput";
import type { Employee } from "db";

export type AssignEmployeeOption = {
  id: number;
  firstName: string;
  lastName: string;
  jobPosition?: string;
};

type AssignEmployeesComboboxProps = {
  employees: AssignEmployeeOption[];
  employeeIds: number[];
  onValueChange: (ids: number[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

function getEmployeeSearchKey(e) {
    return `${e.firstName}${e.lastName}`.trim().toLowerCase()
}

export function AssignEmployeesCombobox({
                                          employees,
                                          employeeIds,
                                          onValueChange,
                                          placeholder = "Assign employees…",
                                          emptyText = "No employees found.",
                                          disabled = false,
}: AssignEmployeesComboboxProps) {

    function getSearchKeysFromIds(ids: number[]): string[] {
        return ids
            .map(id => employees.find(employee => employee.id === id))
            .map(employee => getEmployeeSearchKey(employee))
    }

  const employeeSearchMap: {[K in string]: Employee} = React.useMemo(() => {
    return employees.reduce((map, e) => {
        map[getEmployeeSearchKey(e)] = e;
        return map
    }, {})
  }, [employees])

  const employeeComboboxMap: {[K in string]: React.ReactNode} = React.useMemo(() => {
    return employees.reduce((map, e) => {
        map[getEmployeeSearchKey(e)] = `${e.firstName} ${e.lastName}`
        return map
    }, {})
  }, [employees])

  const [employeeSearchKeys, setEmployeeSearchKeys] = React.useState<string[]>(getSearchKeysFromIds(employeeIds))
  React.useEffect(() => {
    onValueChange(employeeSearchKeys.map(searchKey => employeeSearchMap[searchKey].id))
  }, [employeeSearchMap, employeeSearchKeys, onValueChange])

    const { jobNameMap } = useJobNameMap();

    function groupLabel(positionKey: string): string {
        const position = jobNameMap[positionKey as keyof typeof jobNameMap] ?? positionKey;
        if (position.endsWith("s")) {
            return position
        }
        return position + "s"
    }

  const addAllGroups = React.useMemo(() => {
    const groups: { key: string; ids: number[] }[] = [];

    for (const positionKey of Object.keys(jobNameMap)) {
      const matched = employees.filter(
          (e) => (e.jobPosition ?? "").toLowerCase() === positionKey.toLowerCase()
      );
      if (matched.length === 0) continue;

      const unselected = matched.filter((e) => !employeeIds.includes(e.id));
      if (unselected.length === 0) continue;

      groups.push({ key: positionKey, ids: matched.map((e) => e.id) });
    }

    return groups;
  }, [employees, employeeIds]);

  // Track which group is selected for the "Add all" split button
  const [selectedGroupKey, setSelectedGroupKey] = React.useState<string | null>(null);

  // Keep selected key valid as groups change (e.g. a group becomes fully selected)
  const activeGroup = addAllGroups.find((g) => g.key === selectedGroupKey) ?? addAllGroups[0] ?? null;

  function handleAddAll() {
    if (!activeGroup) return;
    const mergedIds = Array.from(new Set([...employeeIds, ...activeGroup.ids]));
    setEmployeeSearchKeys(getSearchKeysFromIds(mergedIds))
  }

  return (
      <div className="flex flex-col gap-2">
        <ComboboxMapInput
            map={employeeComboboxMap}
            values={employeeSearchKeys}
            setValues={setEmployeeSearchKeys}
            placeholder={placeholder}
            emptyText={emptyText}
            disabled={disabled}
        />

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
                Add all {groupLabel(activeGroup.key)}
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
                        {groupLabel(key)}
                      </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
        ) : null}
      </div>
  );
}



//   const anchor = useComboboxAnchor();

//   const { itemKeys, labelByKey } = React.useMemo(() => {
//     const labelByKey: Record<string, string> = {};
//     for (const e of employees) {
//       labelByKey[`${e.firstName} ${e.lastName}`] = `${e.firstName} ${e.lastName}`.trim();
//     }
//     return { itemKeys: Object.keys(labelByKey), labelByKey };
//   }, [employees]);

//   const stringValue = value.map(String);
        {/* <Combobox
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
        </Combobox> */}