import type { Employee } from "db";
import { useMemo } from "react";
import useGetPermissionLevel from "./useGetPermissionLevel";

export default function useGetEmployeeIsAdmin() {
    const { getPermissionLevel, rolesLoading } = useGetPermissionLevel()
    const getEmployeeIsAdmin = useMemo((): (employee?: Employee) => boolean => {
        return (employee?: Employee) => {
            return getPermissionLevel(employee) >= 1
        }
    }, [getPermissionLevel])
    return { getEmployeeIsAdmin, rolesLoading }
}