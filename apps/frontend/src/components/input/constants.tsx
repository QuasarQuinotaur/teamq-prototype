
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

export const SERVICE_REQUEST_SORT_BY_MAP = {
    title: "Title",
    id: "ID",
    dateDue: "Due date",
    priority: "Priority",
    status: "Status",
    owner: "Assigned by",
} as const

export const SERVICE_REQUEST_ASSIGNMENT_MAP = {
    all: "All requests",
    mine: "Your tasks",
    others: "Other tasks",
} as const

export const SERVICE_REQUEST_STATUS_MAP = {
    "to-do": "To do",
    done: "Done",
} as const

/** Matches dashboard stat cards: overdue, due this week (rolling 7 days from today), to-do bucket, done. */
export const SERVICE_REQUEST_PRESET_MAP = {
    all: "All",
    overdue: "Overdue",
    week: "Due this week",
    todo: "To do",
    done: "Done",
} as const

export const SERVICE_REQUEST_PRIORITY_MAP = {
    none: "None",
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
} as const
export const SORT_METHOD_TYPE_MAP = {
    ascending: "Ascending",
    descending: "Descending",
}
export type SortMethod = keyof typeof SORT_METHOD_TYPE_MAP