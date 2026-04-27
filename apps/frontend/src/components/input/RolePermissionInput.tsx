import {useMemo, type ComponentProps} from "react";
import {SelectTrigger} from "@/elements/select.tsx";
import SelectMapInput from "@/components/input/SelectMapInput.tsx";
import type { Employee } from "db";
import useGetRolePermissionMap from "@/hooks/useGetRolePermissionMap";

type RolePermissionInputProps = {
    employeePermissionLevel: number,
    permissionLevel: number;
    setPermissionLevel: (permission: number) => void;
} & ComponentProps<typeof SelectTrigger>
export default function RolePermissionInput({
                                             employeePermissionLevel,
                                             permissionLevel,
                                             setPermissionLevel,
                                             ...props
}: RolePermissionInputProps) {
    const { getRolePermissionMap, rolesLoading } = useGetRolePermissionMap();
    const lockSelect = useMemo(() => {
        return employeePermissionLevel === permissionLevel
    }, [])
    return (
        <SelectMapInput
            map={getRolePermissionMap(employeePermissionLevel, permissionLevel)}
            initValue={permissionLevel.toString()}
            setValue={level => setPermissionLevel(Number(level))}
            placeholder={"Choose permission level"}
            emptyText={rolesLoading ? "Loading permisssion levels..." : "No permission levels found."}
            lockSelect={lockSelect}
            {...props}
        />
    )
}