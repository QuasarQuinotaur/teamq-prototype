import { type ReactNode, useState } from "react";
import { Item } from "@/components/ui/item.tsx";
import { Button } from "@/components/ui/button.tsx";

type OptionDefinition = {
    iconElement: ReactNode;
}
type IconSelectorProps<T extends Record<string, OptionDefinition>> = {
    defaultKey: keyof T,
    options: T
}
export default function IconSelector<T extends Record<string, OptionDefinition>>(
    { defaultKey, options }: IconSelectorProps<T>
) {
    const [selectedOption, setSelectedOption] = useState(defaultKey)

    return (
        <Item variant={"outline"} className={"gap-0 p-0 overflow-hidden flex-nowrap"}>
            {(Object.entries(options))
                .map(([optionType, definition]) => (
                <Button
                    id={optionType}
                    variant={optionType == selectedOption ? "default" : "ghost"}
                    onClick={() => {
                        if (optionType != selectedOption) {
                            setSelectedOption(optionType)
                        }
                    }}
                >
                    {definition.iconElement}
                </Button>
            ))}
        </Item>
    )
}