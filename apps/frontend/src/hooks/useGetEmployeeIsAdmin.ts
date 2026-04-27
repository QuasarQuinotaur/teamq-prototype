import type { Employee } from "db";
import useJobInfoMap from "./useJobInfoMap";
import { useMemo } from "react";

export default function useGetEmployeeIsAdmin() {
    const { jobInfoMap, rolesLoading } = useJobInfoMap()
    const getEmployeeIsAdmin = useMemo((): (employee: Employee) => boolean => {
        return (employee: Employee) => {
            const role = jobInfoMap[employee.jobPosition]
            console.log("EMPLOYEE ROLE", role)
            return role && role.permissionLevel >= 1
        }
    }, [jobInfoMap])
    return { getEmployeeIsAdmin, rolesLoading }
}