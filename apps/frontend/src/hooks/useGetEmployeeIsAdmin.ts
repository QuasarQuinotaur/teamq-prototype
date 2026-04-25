import type { Employee } from "db";
import useJobInfoMap from "./useJobInfoMap";

export default function useGetEmployeeIsAdmin(): (employee: Employee) => boolean {
    const jobInfoMap = useJobInfoMap()
    return (employee: Employee) => jobInfoMap[employee.jobPosition].isAdmin
}