import { useCallback, useEffect, useMemo, useState } from "react";
import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import DateSelectInput from "../input/DateSelectInput";
import { cn } from "@/lib/utils";
import type { Employee } from "db";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/elements/select.tsx";

export type ReviewFields = {
    date: Date,
    stepName: string,
    employeeId: number | null,
}

export type ReviewDateStrings = {
    date: string,
    setDate: (date: string) => void,
}
type ReviewFormFieldsProps = {
    dateStrings: ReviewDateStrings
} & FormFieldsProps<ReviewFields>
export default function ReviewFormFields({
                                          dateStrings,
                                          fields,
                                          setKey,
}: ReviewFormFieldsProps) {
    const compact = false
    const inputReadable = cn(compact ? "h-8 text-sm" : "h-9 md:text-base", "min-h-8 w-full min-w-0")

    const [employees, setEmployees] = useState<Employee[]>([])
    const [employeesLoading, setEmployeesLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setEmployeesLoading(true)
        void fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employee`, { credentials: "include" })
            .then((res) => res.json())
            .then((data: Employee[]) => {
                if (!cancelled && Array.isArray(data)) {
                    setEmployees(data)
                }
            })
            .catch(() => {
                if (!cancelled) setEmployees([])
            })
            .finally(() => {
                if (!cancelled) setEmployeesLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const sortedEmployees = useMemo(
        () =>
            [...employees].sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
            ),
        [employees],
    )

    const selectValue =
        fields.employeeId != null &&
        sortedEmployees.some((e) => e.id === fields.employeeId)
            ? String(fields.employeeId)
            : undefined

    const onEmployeeSelect = useCallback(
        (value: string) => {
            const id = Number(value)
            const emp = sortedEmployees.find((e) => e.id === id)
            if (!emp) return
            setKey("employeeId", id)
            setKey("stepName", `${emp.firstName} ${emp.lastName}`)
        },
        [setKey, sortedEmployees],
    )

    const setReviewDate = useCallback((date: Date | undefined) => {
        setKey("date", date as ReviewFields["date"])
    }, [setKey])

    const setDateStringFromParent = useCallback((s: string) => {
        dateStrings.setDate(s)
    }, [dateStrings])

    return (
        <div className={"flex flex-col gap-6 w-full min-w-0 justify-center"}>
            <FieldInput
                id={"review-add-form-step-name"}
                label={"Name"}
                required
                createElement={(id) => (
                    <Select
                        value={selectValue}
                        onValueChange={onEmployeeSelect}
                        disabled={employeesLoading}
                    >
                        <SelectTrigger id={id} className={inputReadable}>
                            <SelectValue
                                placeholder={
                                    employeesLoading ? "Loading employees…" : "Select employee"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            <SelectGroup>
                                {employeesLoading ? (
                                    <p className="text-muted-foreground p-2 text-sm">Loading…</p>
                                ) : sortedEmployees.length === 0 ? (
                                    <p className="text-muted-foreground p-2 text-sm">No employees found.</p>
                                ) : (
                                    sortedEmployees.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {`${emp.firstName} ${emp.lastName}`}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                )}
            />
            <FieldInput
                id={"review-add-form-date"}
                label={"Date"}
                required
                createElement={(id) => (
                    <DateSelectInput
                        id={id}
                        placeholder={"Review Date"}
                        date={fields.date}
                        setDate={setReviewDate}
                        dateString={dateStrings.date}
                        setDateString={setDateStringFromParent}
                    />
                )}
            />
        </div>
    )
}