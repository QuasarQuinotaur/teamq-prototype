
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
    ["to-do"]: "To-Do",
    ["in-progress"]: "In Progress",
    completed: "Completed",
}
export const DOCUMENT_TYPE_MAP = {
    links: "Links",
    files: "Files",
}
export type DocumentType = keyof typeof DOCUMENT_TYPE_MAP

export const CONTENT_SORT_BY_MAP = {
    title: "Title",
    expirationDate: "Expiration Date",
    contentType: "Content Type",
    jobPosition: "Job Position",
}
export const EMPLOYEE_SORT_BY_MAP = {
    title: "Title",
    jobPosition: "Job Position",
    dateOfBirth: "Date of Birth",
}
export const SORT_METHOD_TYPE_MAP = {
    ascending: "Ascending",
    descending: "Descending",
}
export type SortMethod = keyof typeof SORT_METHOD_TYPE_MAP