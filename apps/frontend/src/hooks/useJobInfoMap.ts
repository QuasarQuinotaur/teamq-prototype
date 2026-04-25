
export type JobPositionInfo = {
    name: string,
    isAdmin?: boolean,
}

export default function useJobInfoMap(): Record<string, JobPositionInfo> {
    return {
        admin: {name: "Admin", isAdmin: true},
        underwriter: {name: "Underwriter"},
        ["business-analyst"]: {name: "Business Analyst"},
        ["actuarial-analyst"]: {name: "Actuarial Analyst"},
        ["exl-operations"]: {name: "EXL Operations"},
    }
}