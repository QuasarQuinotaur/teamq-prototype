
export const CONTENT_TYPE_MAP = {
    reference: "Reference",
    workflow: "Workflow",
    tool: "Tool",
}
export const JOB_POSITION_TYPE_MAP = {
    admin: "Admin",
    underwriter: "Underwriter",
    ["business-analyst"]: "Business Analyst",
}
export const DOCUMENT_STATUS_TYPE_MAP = {
    ["to-do"]: "Todo",
    ["in-progress"]: "In Progress",
    completed: "Completed",
}
export const DOCUMENT_TYPE_MAP = {
    links: "Links",
    files: "Files",
}
export type DocumentType = keyof typeof DOCUMENT_TYPE_MAP