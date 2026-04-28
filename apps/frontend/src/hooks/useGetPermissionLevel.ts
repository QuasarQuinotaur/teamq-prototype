import type { Employee } from "db";
import useJobInfoMap from "./useJobInfoMap";
import { useMemo } from "react";


export const ROLE_PERMISSION_MAP = {
    admin: "Admin",
    employee: "Employee"
}

export default function useGetPermissionLevel() {
    const { jobInfoMap, rolesLoading } = useJobInfoMap()
    const getPermissionLevel = useMemo((): (employee?: Employee) => number => {
        return (employee?: Employee) => {
            if (!employee) {
                return -1
            }
            const role = jobInfoMap[employee.jobPosition]
            return role && role.permissionLevel
        }
    }, [jobInfoMap])
    return { getPermissionLevel, rolesLoading }
}