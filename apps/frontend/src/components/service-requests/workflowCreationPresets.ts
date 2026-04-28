/**
 * Client-side templates for new service request workflows (ordered stages).
 * Distinct from list-view filter "presets" in constants.tsx.
 */

export type WorkflowCreationPresetKey = "agentUnderwriterApprover";

/** Use as `?template=` when linking to the new-request flow. */
export const WORKFLOW_CREATION_TEMPLATE_AGENT_PIPELINE: WorkflowCreationPresetKey =
    "agentUnderwriterApprover";

export type WorkflowCreationPresetStageSeed = {
    title: string;
    description: string;
};

export type WorkflowCreationPreset = {
    key: WorkflowCreationPresetKey;
    label: string;
    defaultWorkflowTitle: string | null;
    stages: WorkflowCreationPresetStageSeed[];
};

const INTAKE_UNDERWRITING_APPROVAL_PRESET_LABEL = "Intake, underwriting & approval";

export const WORKFLOW_CREATION_PRESETS = {
    agentUnderwriterApprover: {
        key: "agentUnderwriterApprover",
        label: INTAKE_UNDERWRITING_APPROVAL_PRESET_LABEL,
        defaultWorkflowTitle: INTAKE_UNDERWRITING_APPROVAL_PRESET_LABEL,
        stages: [
            {
                title: "Applicant information (Agent)",
                description:
                    "Complete applicant information for this request. Only assignees on this stage should edit this section. When ready, mark this stage complete to submit to the underwriter.",
            },
            {
                title: "Risk assessment (Underwriter)",
                description:
                    "Review the request and complete the risk assessment. Only assignees on this stage should edit this section. When ready, mark this stage complete to send to the approver.",
            },
            {
                title: "Approval decision (Approver)",
                description:
                    "Review the full request and record your decision (approve or reject) in the details above, then mark this stage complete when final. After this stage is done, treat the workflow as closed.",
            },
        ],
    },
} as const satisfies Record<WorkflowCreationPresetKey, WorkflowCreationPreset>;

/** Display order in split-button and template menus */
export const WORKFLOW_CREATION_PRESET_ORDER: WorkflowCreationPresetKey[] = [
    "agentUnderwriterApprover",
];

const WORKFLOW_CREATION_PRESET_KEYS = Object.keys(
    WORKFLOW_CREATION_PRESETS,
) as WorkflowCreationPresetKey[];

export function isWorkflowCreationPresetKey(s: string | null | undefined): s is WorkflowCreationPresetKey {
    if (s == null || s === "") return false;
    return (WORKFLOW_CREATION_PRESET_KEYS as string[]).includes(s);
}

export function getWorkflowCreationPreset(
    key: string | null | undefined,
): WorkflowCreationPreset | null {
    if (!isWorkflowCreationPresetKey(key)) return null;
    return WORKFLOW_CREATION_PRESETS[key];
}
