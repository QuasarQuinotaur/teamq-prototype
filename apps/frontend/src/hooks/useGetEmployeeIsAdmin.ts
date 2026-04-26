import type { Employee } from "db";
import useJobInfoMap from "./useJobInfoMap";
import { useMemo } from "react";

export default function useGetEmployeeIsAdmin() {
    const { jobInfoMap, rolesLoading } = useJobInfoMap()
    const getEmployeeIsAdmin = useMemo((): (employee: Employee) => boolean => {
        return (employee: Employee) => {
            const role = jobInfoMap[employee.jobPosition]
            return role && role.isAdmin
        }
    }, [jobInfoMap])
    return { getEmployeeIsAdmin, rolesLoading }
}