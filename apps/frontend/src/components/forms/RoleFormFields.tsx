import type {FormFieldsProps} from "@/components/forms/Form.tsx";
import {FieldInput} from "@/components/forms/Field.tsx";
import {Input} from "@/elements/input.tsx";
import {cn} from "@/lib/utils.ts";
import RolePermissionInput from "../input/RolePermissionInput";
import type { Employee } from "db";

export type RoleFields = {
    name: string,
    permissionLevel: number,
}
type RoleFormFieldsProps = {
    permissionLevel: number;
} & FormFieldsProps<RoleFields>
export default function RoleFormFields({
                                          permissionLevel,
                                          fields,
                                          setKey,
}: RoleFormFieldsProps) {
    const compact = false
    const inputReadable = cn(compact ? "h-8 text-sm" : "h-9 md:text-base", "min-h-8 w-full min-w-0")

    return (
        <div className={"flex flex-col gap-6 w-full min-w-0 justify-center"}>
            <FieldInput
                id={"role-create-form-name"}
                label={"Role Name"}
                required
                createElement={(id) => (
                    <Input
                        id={id}
                        className={inputReadable}
                        placeholder={"Name"}
                        value={fields.name}
                        onChange={(e) => {
                            setKey("name", e.target.value)
                        }}
                    />
                )}
            />
            <FieldInput
                id={"role-create-form-permission-level"}
                label={"Permission Level"}
                required
                createElement={(id) => (
                    <RolePermissionInput
                        id={id}
                        employeePermissionLevel={permissionLevel}
                        permissionLevel={fields.permissionLevel}
                        setPermissionLevel={(permissionLevel) => {
                            setKey("permissionLevel", permissionLevel)
                        }}
                    />
                )}
            />
        </div>
    )
}