import type {FormState} from "@/components/forms/Form.tsx";
import * as React from "react";
import DocumentForm from "@/components/forms/DocumentForm.tsx";
import EmployeeForm from "@/components/forms/EmployeeForm.tsx";

export type FormType = "Document" | "Employee"
export type FormOfTypeProps = {
    formType: FormType
} & FormState
export function FormOfType({
                          formType,
                          ...state
}: FormOfTypeProps) {
    return (
        (formType == "Document" ? (<DocumentForm {...state} />) :
            formType == "Employee" ? (<EmployeeForm {...state} />) :
                null)
    )
}