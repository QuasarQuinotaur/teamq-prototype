
export const CONTENT_TYPE_MAP: {[K in string]: string} = {
    reference: "Reference",
    workflow: "Workflow",
    tool: "Tool",
}
export const JOB_POSITION_TYPE_MAP: {[K in string]: string} = {
    admin: "Admin",
    underwriter: "Underwriter",
    ["business-analyst"]: "Business Analyst",
}
export const DOCUMENT_STATUS_TYPE_MAP: {[K in string]: string} = {
    ["to-do"]: "Todo",
    ["in-progress"]: "In Progress",
    completed: "Completed",
}