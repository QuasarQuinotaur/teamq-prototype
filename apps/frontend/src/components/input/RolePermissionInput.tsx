import type {ComponentProps} from "react";
import {SelectTrigger} from "@/elements/select.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";
import { ROLE_PERMISSION_MAP, type RolePermission } from "./constants";

type RolePermissionInputProps = {
    permission: RolePermission;
    setPermission: (permission: RolePermission) => void;
} & ComponentProps<typeof SelectTrigger>
export default function RolePermissionInput({
                                             permission,
                                             setPermission,
                                             ...props
}: RolePermissionInputProps) {
    return (
        <SelectMapInput
            map={ROLE_PERMISSION_MAP}
            initValue={permission}
            setValue={setPermission}
            placeholder={"Choose role permission"}
            emptyText={"No permissions found."}
            {...props}
        />
    )
}