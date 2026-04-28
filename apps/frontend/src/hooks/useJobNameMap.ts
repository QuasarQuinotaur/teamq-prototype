import { useMemo } from "react";
import useJobInfoMap from "./useJobInfoMap";

export default function useJobNameMap() {
    const { jobInfoMap, rolesLoading } = useJobInfoMap();
    const jobNameMap = useMemo((): Record<string, string> => {
        return Object.entries(jobInfoMap).reduce((acc, [id, jobInfo]) => {
            acc[id] = jobInfo.name
            return acc
        }, {})
    }, [jobInfoMap])
    return { jobNameMap, rolesLoading }
}