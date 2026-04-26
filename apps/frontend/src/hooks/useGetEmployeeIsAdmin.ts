import type { Employee } from "db";
import useJobInfoMap from "./useJobInfoMap";
import { useMemo } from "react";

export default function useGetEmployeeIsAdmin(): (employee: Employee) => boolean {
    const { jobInfoMap } = useJobInfoMap()
    const getEmployeeIsAdmin = useMemo(() => {
        return (employee: Employee) => {
            const role = jobInfoMap[employee.jobPosition]
            return role && role.isAdmin
        }
    }, [jobInfoMap])
    return getEmployeeIsAdmin
}