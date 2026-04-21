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

export type LinkContentOption = {
  id: number;
  title: string;
};

type LinkContentsComboboxProps = {
  contents: LinkContentOption[];
  value: number[];
  onValueChange: (ids: number[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

export function LinkContentsCombobox({
  contents,
  value,
  onValueChange,
  placeholder = "Link documents…",
  emptyText = "No documents found.",
  disabled = false,
}: LinkContentsComboboxProps) {
  const anchor = useComboboxAnchor();

  const { itemKeys, labelByKey } = React.useMemo(() => {
    const labelByKey: Record<string, string> = {};
    for (const c of contents) {
      labelByKey[String(c.id)] = c.title.trim() || `Document #${c.id}`;
    }
    return { itemKeys: Object.keys(labelByKey), labelByKey };
  }, [contents]);

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
      <ComboboxChips ref={anchor} className="w-full">
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
