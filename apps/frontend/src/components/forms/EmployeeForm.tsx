import { useState } from "react";
import * as React from "react";

import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldSet,
} from "@/components/Field.tsx"
import { Input } from "@/elements/input.tsx"
import JobPositionInput from "@/components/input/JobPositionInput.tsx";
import DateSelectInput from "@/components/input/DateSelectInput.tsx";
import { ScrollArea } from "@/elements/scroll-area.tsx";
import { type FormProps, FormWindowActions } from "@/components/forms/Form.tsx";
import { formatDate } from "@/lib/utils.ts";
import {
    Dialog as AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/AlertDialog.tsx";

type EmployeeFields = {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date | undefined;
    jobPosition: string;
    isSubmitting: boolean;
}

const DEFAULT_EMPLOYEE: EmployeeFields = {
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: undefined,
    jobPosition: "",
    isSubmitting: false,
}

function itemAsEmployee(item: object): EmployeeFields {
    const e = item as { firstName: string; lastName: string; email: string; dateOfBirth: string; jobPosition: string };
    return {
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        dateOfBirth: new Date(e.dateOfBirth),
        jobPosition: e.jobPosition,
        isSubmitting: false,
    };
}

export default function EmployeeForm({ onCancel, fromItem }: FormProps) {
    const initial = fromItem ? itemAsEmployee(fromItem) : DEFAULT_EMPLOYEE;
    const [employee, setEmployee] = useState<EmployeeFields>(initial);
    const [dobString, setDobString] = useState(
        initial.dateOfBirth ? formatDate(initial.dateOfBirth) : ""
    );
    const [confirmOpen, setConfirmOpen] = useState(false);

    function set<T extends keyof EmployeeFields>(key: T, value: EmployeeFields[T]) {
        setEmployee((prev) => ({ ...prev, [key]: value }));
    }

    function reset() {
        setEmployee(DEFAULT_EMPLOYEE);
        setDobString("");
    }

    async function doSubmit() {
        const { firstName, lastName, email, dateOfBirth, jobPosition } = employee;
        set("isSubmitting", true);
        try {
            const isUpdate = fromItem != null;
            const url = isUpdate
                ? `${import.meta.env.VITE_BACKEND_URL}/api/employees/${(fromItem as { id: number }).id}`
                : `${import.meta.env.VITE_BACKEND_URL}/api/employees`;
            const res = await fetch(url, {
                method: isUpdate ? "PUT" : "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    dateOfBirth: dateOfBirth!.toISOString(),
                    jobPosition,
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || (isUpdate ? "Update failed" : "Create failed"));
            reset();
            if (onCancel) onCancel();
        } catch (err) {
            console.error("Submit failed:", err);
        } finally {
            set("isSubmitting", false);
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const { firstName, lastName, email, dateOfBirth, jobPosition } = employee;
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !dateOfBirth || !jobPosition.trim()) {
            console.error("Missing required fields");
            return;
        }
        if (fromItem) {
            setConfirmOpen(true);
        } else {
            doSubmit();
        }
    }

    return (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <form
                onReset={(e) => { e.preventDefault(); reset(); }}
                onSubmit={handleSubmit}
            >
                <ScrollArea className={"h-96 w-full pr-4 mb-4"}>
                    <FieldGroup className={"p-1"}>
                        <FieldSet>
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="employee-form-first-name">First Name</FieldLabel>
                                    <Input
                                        id="employee-form-first-name"
                                        placeholder="First Name"
                                        value={employee.firstName}
                                        onChange={(e) => set("firstName", e.target.value)}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="employee-form-last-name">Last Name</FieldLabel>
                                    <Input
                                        id="employee-form-last-name"
                                        placeholder="Last Name"
                                        value={employee.lastName}
                                        onChange={(e) => set("lastName", e.target.value)}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="employee-form-email">Email</FieldLabel>
                                    <Input
                                        id="employee-form-email"
                                        placeholder="email@example.com"
                                        type="email"
                                        value={employee.email}
                                        onChange={(e) => set("email", e.target.value)}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="employee-form-dob">Date of Birth</FieldLabel>
                                    <DateSelectInput
                                        id="employee-form-dob"
                                        placeholder="Date of Birth"
                                        date={employee.dateOfBirth}
                                        setDate={(date) => set("dateOfBirth", date)}
                                        dateString={dobString}
                                        setDateString={setDobString}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="employee-form-job-position">Job Position</FieldLabel>
                                    <JobPositionInput
                                        id="employee-form-job-position"
                                        jobPosition={employee.jobPosition}
                                        setJobPosition={(pos) => set("jobPosition", pos)}
                                    />
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </FieldGroup>
                </ScrollArea>
                <FormWindowActions isSubmitting={employee.isSubmitting} onCancel={onCancel} />
            </form>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will save your changes.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setConfirmOpen(false); doSubmit(); }}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
