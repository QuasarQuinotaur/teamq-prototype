import useJobInfoMap from "./useJobInfoMap";

export default function useJobNameMap(): Record<string, string> {
    const jobInfoMap = useJobInfoMap();
    return Object.entries(jobInfoMap).reduce((acc, [id, jobInfo]) => {
        acc[id] = jobInfo.name
        return acc
    }, {})
}