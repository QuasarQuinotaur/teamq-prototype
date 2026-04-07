import {type ComponentProps, useState} from "react"
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
} & ComponentProps<typeof InputGroupInput>
function DateSelectInput(
    { date, setDate, dateString, setDateString, ...props }: DateProps
) {
    const [dateOpen, setDateOpen] = useState(false)

    return (
        <InputGroup>
            <InputGroupInput
                value={dateString}
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
                        setDateOpen(true)
                    }
                }}
                {...props}
            />
            <InputGroupAddon align="inline-end">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                        <InputGroupButton
                            id={"employee-form-dob-picker"}
                            variant="ghost"
                            aria-label="Select date"
                        >
                            <CalendarIcon /><span className="sr-only">Select date</span>
                        </InputGroupButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            defaultMonth={date}
                            // captionLayout="dropdown"
                            onSelect={(date) => {
                                setDate(date)
                                setDateString(formatDate(date))
                                setDateOpen(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </InputGroupAddon>
        </InputGroup>
    )
}

export default DateSelectInput