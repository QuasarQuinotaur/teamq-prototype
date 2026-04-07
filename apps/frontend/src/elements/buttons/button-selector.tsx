import { type ReactNode} from "react";
import { Item } from "@/elements/item.tsx";
import { Button } from "@/elements/buttons/button.tsx";

type OptionDefinition = {
    buttonElement: ReactNode;
}
type ButtonSelectorProps<T extends Record<string, OptionDefinition>> = {
    value: keyof T;
    onChange: (value: keyof T) => void;
    options: T;
}
export default function ButtonSelector<T extends Record<string, OptionDefinition>>(
    { value, onChange, options }: ButtonSelectorProps<T>
) {

    return (
        <Item variant={"outline"} className={"gap-0 p-0 overflow-hidden flex-nowrap"}>
            {Object.entries(options).map(([option, definition]) => (
                <Button
                    key={option}
                    id={option}
                    variant={option === value ? "default" : "ghost"}
                    onClick={() => {
                        if (option != value) {
                            onChange(option as keyof T);
                        }
                    }}
                >
                    {definition.buttonElement}
                </Button>
            ))}
        </Item>
    )
}