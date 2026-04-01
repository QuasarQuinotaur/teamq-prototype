import { type ReactNode, useState } from "react";
import { Item } from "@/components/ui/item.tsx";
import { Button } from "@/components/ui/button.tsx";

type OptionDefinition = {
    buttonElement: ReactNode;
}
type ButtonSelectorProps<T extends Record<string, OptionDefinition>> = {
    defaultOption: keyof T,
    options: T
}
export default function ButtonSelector<T extends Record<string, OptionDefinition>>(
    { defaultOption, options }: ButtonSelectorProps<T>
) {
    const [selectedOption, setSelectedOption] = useState(defaultOption)

    return (
        <Item variant={"outline"} className={"gap-0 p-0 overflow-hidden flex-nowrap"}>
            {Object.entries(options).map(([option, definition]) => (
                <Button
                    id={option}
                    variant={option == selectedOption ? "default" : "ghost"}
                    onClick={() => {
                        if (option != selectedOption) {
                            setSelectedOption(option)
                        }
                    }}
                >
                    {definition.buttonElement}
                </Button>
            ))}
        </Item>
    )
}