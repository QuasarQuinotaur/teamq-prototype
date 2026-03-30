import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    InputGroup,
    InputGroupAddon, InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

type DateOfBirthProps = {
    dateOfBirth: Date | undefined;
    setDateOfBirth: (dateOfBirth: Date | undefined) => void;
    dateString: string;
    setDateString: (dateString: string) => void;
}
function DateOfBirth({ dateOfBirth, setDateOfBirth, dateString, setDateString }: DateOfBirthProps) {
    const [dateOpen, setDateOpen] = useState(false)

    return (
        <InputGroup>
            <InputGroupInput
                id={"employee-form-dob"}
                value={dateString}
                placeholder="Date of Birth"
                onChange={(e) => {
                    const date = new Date(e.target.value)
                    setDateString(e.target.value)
                    if (isValidDate(date)) {
                        setDateOfBirth(date)
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setDateOpen(true)
                    }
                }}
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
                            selected={dateOfBirth}
                            defaultMonth={dateOfBirth}
                            // captionLayout="dropdown"
                            onSelect={(date) => {
                                setDateOfBirth(date)
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

export default DateOfBirth