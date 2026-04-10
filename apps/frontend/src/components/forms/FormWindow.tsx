// Shows a form in a window with a header

import type {FormState} from "@/components/forms/Form.tsx";
import DocumentForm from "@/components/forms/DocumentForm.tsx";
import EmployeeForm from "@/components/forms/EmployeeForm.tsx";

const DEFAULT_FORM_HEADERS: Record<FormType, string> = {
    Document: "Add Document",
    Employee: "Add Employee"
}

export type FormType = "Document" | "Employee"
export type FormWindowProps = {
    formType: FormType,
    header?: string,
} & FormState
export default function FormWindow({
                                       formType,
                                       header,
                                       ...state
}: FormWindowProps) {
    return (
        <>
            <h2>{header ?? DEFAULT_FORM_HEADERS[formType]}</h2>
            {(
                formType == "Document" ? (<DocumentForm {...state} />) :
                    formType == "Employee" ? (<EmployeeForm {...state} />) :
                        (<></>)
            )}
        </>
    )
}