import {type ComponentProps, memo, useState} from "react"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/Calendar.tsx"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/elements/buttons/popover.tsx"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/elements/input-group.tsx"
import { formatDate, isValidDate } from "@/lib/utils.ts";


type DateProps = {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    dateString: string;
    setDateString: (dateString: string) => void;
    disabled?: boolean;
} & Omit<ComponentProps<typeof InputGroupInput>, "disabled">;
function DateSelectInput({
                             date,
                             setDate,
                             dateString,
                             setDateString,
                             disabled = false,
                             ...props
}: DateProps) {
    const [dateOpen, setDateOpen] = useState(false)

    return (
        <InputGroup>
            <InputGroupInput
                value={dateString}
                disabled={disabled}
                onChange={(e) => {
                    const date = new Date(e.target.value)
                    setDateString(e.target.value)
                    if (isValidDate(date)) {
                        setDate(date)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault()
                        if (!disabled) setDateOpen(true)
                    }
                }}
                {...props}
            />
            <InputGroupAddon align="inline-end">
                <Popover
                    open={disabled ? false : dateOpen}
                    onOpenChange={(o) => {
                        if (!disabled) setDateOpen(o);
                    }}
                >
                    <PopoverTrigger asChild>
                        <InputGroupButton
                            id={"employee-form-dob-picker"}
                            variant="ghost"
                            aria-label="Select date"
                            disabled={disabled}
                        >
                            <CalendarIcon /><span className="sr-only">Select date</span>
                        </InputGroupButton>
                    </PopoverTrigger>
                    <PopoverContent
                        className="z-[100] w-auto overflow-hidden p-0"
                        align="start"
                    >
                        <Calendar
                            mode="single"
                            selected={date}
                            defaultMonth={date}
                            fixedWeeks
                            onSelect={(date) => {
                                setDate(date)
                                setDateString(formatDate(date))
                                setDateOpen(false)
                            }}
                            className={"pointer-events-auto"}
                        />
                    </PopoverContent>
                </Popover>
            </InputGroupAddon>
        </InputGroup>
    )
}

export default memo(DateSelectInput)