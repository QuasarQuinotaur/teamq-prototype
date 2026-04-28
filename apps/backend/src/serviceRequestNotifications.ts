import type { NotificationRepository } from "./NotificationRepository.ts";

export const SERVICE_REQ_WORKFLOW_FYI_TYPE = "Service request workflow assignment";

export const SERVICE_REQ_STAGE_READY_TYPE = "Service request stage ready";

export function workflowDisplayTitle(title: string | null | undefined): string {
    const t = title?.trim();
    return t ? t : "Untitled workflow";
}

export function stageDisplayTitle(
    title: string | null | undefined,
    stageOrder: number,
): string {
    const t = title?.trim();
    return t ? t : `Stage ${stageOrder}`;
}

type StageInput = {
    stageOrder: number;
    title?: string | null;
    employeeIds: number[];
    contentIds: number[];
};

/**
 * One FYI per employee listing all stages they appear on; linked docs union across those stages.
 */
export async function notifyWorkflowAssignmentFyi(
    notificationRepo: NotificationRepository,
    workflowTitle: string | null | undefined,
    stages: StageInput[],
): Promise<void> {
    const wfLabel = workflowDisplayTitle(workflowTitle);
    const byEmp = new Map<number, { stageLabels: string[]; contentIds: Set<number> }>();

    for (const s of stages) {
        const stageLabel = stageDisplayTitle(s.title, s.stageOrder);
        for (const empId of s.employeeIds) {
            if (!byEmp.has(empId)) {
                byEmp.set(empId, { stageLabels: [], contentIds: new Set<number>() });
            }
            const entry = byEmp.get(empId)!;
            entry.stageLabels.push(stageLabel);
            for (const cid of s.contentIds) {
                entry.contentIds.add(cid);
            }
        }
    }

    await Promise.all(
        [...byEmp.entries()].map(([employeeNotifiedID, { stageLabels, contentIds }]) => {
            const uniqueStages = [...new Set(stageLabels)];
            const stagePart =
                uniqueStages.length === 1
                    ? `stage "${uniqueStages[0]}"`
                    : `stages ${uniqueStages.map((x) => `"${x}"`).join(", ")}`;
            const customMsg = `You are assigned to ${stagePart} in workflow "${wfLabel}".`;
            return notificationRepo.create({
                type: SERVICE_REQ_WORKFLOW_FYI_TYPE,
                employeeNotifiedID,
                customMsg,
                ...(contentIds.size ? { contentIds: [...contentIds] } : {}),
            });
        }),
    );
}

export async function notifyStageReady(
    notificationRepo: NotificationRepository,
    workflowTitle: string | null | undefined,
    stageTitle: string | null | undefined,
    stageOrder: number,
    employeeIds: number[],
    contentIds?: number[],
): Promise<void> {
    if (!employeeIds.length) return;
    const wfLabel = workflowDisplayTitle(workflowTitle);
    const stLabel = stageDisplayTitle(stageTitle, stageOrder);
    await notificationRepo.createMany({
        type: SERVICE_REQ_STAGE_READY_TYPE,
        employeeIds,
        customMsg: `Your stage "${stLabel}" in workflow "${wfLabel}" is ready to work on.`,
        ...(contentIds?.length ? { contentIds } : {}),
    });
}
