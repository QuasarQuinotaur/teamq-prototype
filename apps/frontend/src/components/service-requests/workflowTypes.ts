/**
 * Service request workflows from GET /servicereqs/assigned/0 and GET /servicereqs/detail/:workflowId
 */

export type WorkflowEmployeePayload = {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
};

export type WorkflowContentPayload = {
    id: number;
    title: string;
    filePath?: string | null;
};

export type WorkflowStagePayload = {
    id: number;
    workflowId: number;
    stageOrder: number;
    dateCreated?: string;
    dateDue: string | null;
    description: string | null;
    priority: string | null;
    status: string;
    title: string | null;
    employees: WorkflowEmployeePayload[];
    contents: WorkflowContentPayload[];
};

export type WorkflowPayload = {
    id: number;
    dateCreated?: string;
    title: string | null;
    ownerId: number;
    owner: WorkflowEmployeePayload;
    stages: WorkflowStagePayload[];
};

export function sortedStages(stages: WorkflowStagePayload[]): WorkflowStagePayload[] {
    return [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
}

/** Workflow is complete when every stage is done. */
export function rollupWorkflowStatus(stages: WorkflowStagePayload[]): "done" | "to-do" {
    const ordered = sortedStages(stages);
    if (!ordered.length) return "to-do";
    return ordered.every((s) => s.status.trim() === "done") ? "done" : "to-do";
}

/**
 * Earliest due date among stages that are not yet done (pipeline focus).
 * If all done or none have dates, falls back to earliest due among all stages with a date.
 */
export function rollupDueDate(stages: WorkflowStagePayload[]): string | null {
    const ordered = sortedStages(stages);
    const incomplete = ordered.filter((s) => s.status.trim() !== "done");
    const pool = incomplete.length ? incomplete : ordered;
    const dates = pool
        .map((s) => s.dateDue)
        .filter((d): d is string => d != null && String(d).trim() !== "");
    if (!dates.length) return null;
    let best = dates[0]!;
    let bestMs = Date.parse(best);
    for (let i = 1; i < dates.length; i++) {
        const ms = Date.parse(dates[i]!);
        if (!Number.isNaN(ms) && ms < bestMs) {
            best = dates[i]!;
            bestMs = ms;
        }
    }
    return best;
}

/** Snippet text for cards/search when workflow has no umbrella description. */
export function rollupDescription(stages: WorkflowStagePayload[]): string | null {
    const ordered = sortedStages(stages);
    for (const s of ordered) {
        if (s.status.trim() === "done") continue;
        const t = s.description?.trim();
        if (t) return t;
    }
    for (const s of ordered) {
        const t = s.description?.trim();
        if (t) return t;
    }
    return null;
}

export function employeeIdsFromStage(stage: WorkflowStagePayload): Set<number> {
    return new Set(stage.employees.map((e) => e.id));
}

/** Union of assignees across all stages. */
export function allEmployeeIdsFromWorkflow(stages: WorkflowStagePayload[]): Set<number> {
    const ids = new Set<number>();
    for (const s of stages) {
        for (const e of s.employees) ids.add(e.id);
    }
    return ids;
}

export function allEmployeesUnion(stages: WorkflowStagePayload[]): WorkflowEmployeePayload[] {
    const map = new Map<number, WorkflowEmployeePayload>();
    for (const s of sortedStages(stages)) {
        for (const e of s.employees) {
            if (!map.has(e.id)) map.set(e.id, e);
        }
    }
    return [...map.values()].sort((a, b) => a.id - b.id);
}

export function allContentsUnion(stages: WorkflowStagePayload[]): WorkflowContentPayload[] {
    const map = new Map<number, WorkflowContentPayload>();
    for (const s of stages) {
        for (const c of s.contents) {
            if (!map.has(c.id)) map.set(c.id, c);
        }
    }
    return [...map.values()].sort((a, b) => a.id - b.id);
}

/** Index of first stage not done, or null if all complete. */
export function currentStageIndex(stages: WorkflowStagePayload[]): number | null {
    const ordered = sortedStages(stages);
    const i = ordered.findIndex((s) => s.status.trim() !== "done");
    return i === -1 ? null : i;
}

export function isDoneStatus(status: string): boolean {
    return status.trim() === "done";
}

/**
 * Whether the user may set stage status to `next` (linear pipeline).
 * Mark done: user assigned to stage, prior stages all done, stage not already done.
 * Mark to-do: user assigned, stage was done, no later stage is done.
 */
export function canUserToggleStageStatus(
    stagesOrdered: WorkflowStagePayload[],
    stageIndex: number,
    userId: number,
    nextStatus: "done" | "to-do",
): boolean {
    return stageToggleBlockedReason(stagesOrdered, stageIndex, userId, nextStatus) === null;
}

/** Null if toggle allowed; otherwise a short UI message. */
export function stageToggleBlockedReason(
    stagesOrdered: WorkflowStagePayload[],
    stageIndex: number,
    userId: number,
    nextStatus: "done" | "to-do",
): string | null {
    const s = stagesOrdered[stageIndex];
    if (!s) return "Invalid stage.";
    if (!employeeIdsFromStage(s).has(userId)) {
        return "Only assignees can update this stage.";
    }

    if (nextStatus === "done") {
        if (isDoneStatus(s.status)) return "Already completed.";
        for (let i = 0; i < stageIndex; i++) {
            if (!isDoneStatus(stagesOrdered[i]!.status)) {
                return "Finish earlier stages first.";
            }
        }
        return null;
    }

    if (!isDoneStatus(s.status)) return "Stage is not completed.";
    for (let j = stageIndex + 1; j < stagesOrdered.length; j++) {
        if (isDoneStatus(stagesOrdered[j]!.status)) {
            return "Revert later stages before undoing this one.";
        }
    }
    return null;
}

export function displayWorkflowTitle(workflow: WorkflowPayload): string {
    const w = workflow.title?.trim();
    if (w) return w;
    const stages = sortedStages(workflow.stages);
    const st = stages[0]?.title?.trim();
    if (st) return st;
    return `Service request #${workflow.id}`;
}

/** Workflow plus rollup fields used by list, filters, and dashboard widgets. */
export type WorkflowListRow = WorkflowPayload & {
    status: string;
    dateDue: string | null;
    description: string | null;
    priority: string | null;
    employees: WorkflowEmployeePayload[];
    contents: WorkflowContentPayload[];
};

const PRIORITY_RANK = ["none", "low", "normal", "high", "urgent"] as const;

/** Highest priority among incomplete stages (ties broken by stage order); fallback all stages. */
export function rollupWorkflowPriority(stages: WorkflowStagePayload[]): string | null {
    const ordered = sortedStages(stages);
    const incomplete = ordered.filter((s) => !isDoneStatus(s.status));
    const pool = incomplete.length ? incomplete : ordered;
    let bestRank = -1;
    let pick: string | null = null;
    for (const s of pool) {
        const raw = (s.priority?.trim() || "none").toLowerCase();
        const idx = PRIORITY_RANK.indexOf(raw as (typeof PRIORITY_RANK)[number]);
        const rank = idx >= 0 ? idx : 0;
        if (rank > bestRank) {
            bestRank = rank;
            pick = s.priority ?? null;
        }
    }
    return pick;
}

export function enrichWorkflowForList(w: WorkflowPayload): WorkflowListRow {
    const stages = sortedStages(w.stages);
    return {
        ...w,
        status: rollupWorkflowStatus(stages),
        dateDue: rollupDueDate(stages),
        description: rollupDescription(stages),
        priority: rollupWorkflowPriority(stages),
        employees: allEmployeesUnion(stages),
        contents: allContentsUnion(stages),
    };
}

export function mergeStageStatus(
    row: WorkflowListRow,
    workflowId: number,
    stageId: number,
    status: string,
): WorkflowListRow {
    if (row.id !== workflowId) return row;
    const stages = row.stages.map((s) => (s.id === stageId ? { ...s, status } : s));
    return enrichWorkflowForList({ ...row, stages });
}
