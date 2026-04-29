import { Router } from "express";
import { prisma } from "db";
import {
    ServiceRequestRepository,
    uniqueStageEmployeeIds,
    type WorkflowCatalogEntry,
} from "../ServiceRequestRepository.ts";
import { NotificationRepository } from "../NotificationRepository.ts";
import { notifyStageReady, notifyWorkflowAssignmentFyi } from "../serviceRequestNotifications.ts";
import { tryGetSignedUrl } from "../lib/supabase.ts";
import { getEmployeeFromRequest } from "../app.ts";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;

const router = Router();
const serviceRequestRepo = new ServiceRequestRepository();
const notificationRepo = new NotificationRepository();

function toIdList(raw: unknown): number[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
}

/** For PUT bodies: omitted/non-array → leave field unchanged; array (maybe empty) → replace. */
function bodyIdArray(raw: unknown): number[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    return raw.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
}

function parseBodyDateDue(raw: unknown): Date | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null || raw === "") return null;
    if (typeof raw !== "string") return undefined;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function parseBodyPriority(raw: unknown): string | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    if (typeof raw !== "string") return undefined;
    const t = raw.trim();
    return t === "" ? null : t;
}

/** Omitted/empty → no update. Invalid value → error message for 400. */
function parseBodyServiceRequestStatus(raw: unknown): { value?: string; error?: string } {
    if (raw === undefined) return {};
    if (raw === null || raw === "") return {};
    if (typeof raw !== "string") return { error: "Invalid status" };
    const t = raw.trim();
    if (t === "") return {};
    if (t === "to-do" || t === "done") return { value: t };
    return { error: 'Status must be "to-do" or "done"' };
}

type EmployeeWithPhoto = {
    id: number;
    userPhoto: { path: string } | null;
};

async function employeeWithProfileUrl<T extends EmployeeWithPhoto>(
    emp: T,
): Promise<Omit<T, "userPhoto"> & { profileImageUrl?: string }> {
    const { userPhoto, ...rest } = emp;
    let profileImageUrl: string | undefined;
    if (userPhoto?.path) {
        profileImageUrl = await tryGetSignedUrl(userPhoto.path, 3600);
    }
    return { ...rest, profileImageUrl };
}

async function hydrateWorkflowEntry(wf: WorkflowCatalogEntry) {
    const owner = await employeeWithProfileUrl(wf.owner);
    const stages = await Promise.all(
        wf.stages.map(async (st) => ({
            ...st,
            employees: await Promise.all(st.employees.map((e) => employeeWithProfileUrl(e))),
        })),
    );
    return { ...wf, owner, stages };
}

async function hydrateStageDeep(stage: NonNullable<Awaited<ReturnType<ServiceRequestRepository["getStageById"]>>>) {
    const wf = stage.workflow;
    const owner = await employeeWithProfileUrl(wf.owner);
    const stages = await Promise.all(
        wf.stages.map(async (s) => ({
            ...s,
            employees: await Promise.all(s.employees.map((e) => employeeWithProfileUrl(e))),
        })),
    );
    return {
        ...stage,
        employees: await Promise.all(stage.employees.map((e) => employeeWithProfileUrl(e))),
        workflow: { ...wf, owner, stages },
    };
}

router.get("/assigned/:flag", requiresAuth(), async (req, res) => {
    const assigned = await serviceRequestRepo.getAllWithDetails();

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>Assigned workflows</h1>
            <script>
              const data = ${JSON.stringify(assigned)};
              console.log("=== ASSIGNED WORKFLOWS ===", data);
            </script>
          </body>
        </html>
      `);
    } else {
        const withUrls = await Promise.all(assigned.map((wf) => hydrateWorkflowEntry(wf)));
        res.json(withUrls);
    }
});

router.get("/detail/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const wf = await serviceRequestRepo.getWorkflowById(id);
        if (!wf) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(await hydrateWorkflowEntry(wf));
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch" });
    }
});

/**
 * Create workflow with ordered stages.
 * Body: { ownerId, title?, stages: [{ title?, description?, dateDue?, priority?, employeeIds?, contentIds? }] }
 */
function parseRequiredPositiveInt(raw: unknown): number | null {
    if (raw === undefined || raw === null) return null;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
    return n;
}

router.post("/", requiresAuth(), async (req, res) => {
    const { title, stages } = req.body;
    const ownerId = parseRequiredPositiveInt(req.body.ownerId);
    if (ownerId === null) {
        res.status(400).json({ error: "ownerId is required (positive integer)" });
        return;
    }
    if (!Array.isArray(stages) || stages.length < 1) {
        res.status(400).json({ error: "stages must be a non-empty array" });
        return;
    }
    if (!stages.every((raw: unknown) => raw !== null && typeof raw === "object")) {
        res.status(400).json({ error: "Each stage must be an object" });
        return;
    }

    const parsedStages = stages.map((raw: Record<string, unknown>, index: number) => ({
        title: typeof raw.title === "string" ? raw.title : undefined,
        description: typeof raw.description === "string" ? raw.description : undefined,
        dateDue: parseBodyDateDue(raw.dateDue),
        priority: parseBodyPriority(raw.priority),
        employeeIds: toIdList(raw.employeeIds),
        contentIds: toIdList(raw.contentIds),
        stageOrder: index + 1,
    }));

    try {
        const wf = await serviceRequestRepo.createWorkflowWithStages({
            ownerId,
            title: typeof title === "string" ? title : undefined,
            stages: parsedStages.map(
                ({ title: st, description, dateDue, priority, employeeIds, contentIds }) => ({
                    title: st,
                    description,
                    dateDue,
                    priority,
                    employeeIds,
                    contentIds,
                }),
            ),
        });

        const fyiStages = parsedStages.map((s, index) => ({
            stageOrder: index + 1,
            title: s.title,
            employeeIds: uniqueStageEmployeeIds(s.employeeIds),
            contentIds: s.contentIds,
        }));

        await notifyWorkflowAssignmentFyi(notificationRepo, wf.title, fyiStages);

        const first = parsedStages[0]!;
        await notifyStageReady(
            notificationRepo,
            wf.title,
            first.title ?? null,
            1,
            uniqueStageEmployeeIds(first.employeeIds),
            first.contentIds.length ? first.contentIds : undefined,
        );

        res.json(await hydrateWorkflowEntry(wf));
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Create failed" });
    }
});

router.put("/workflow/:workflowId", requiresAuth(), async (req, res) => {
    const id = Number(req.params.workflowId);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid workflow id" });
        return;
    }
    const { title, ownerId: rawOwnerId } = req.body;
    const parsedOwner = parseRequiredPositiveInt(rawOwnerId);
    try {
        const wf = await serviceRequestRepo.updateWorkflow(id, {
            ...(typeof title === "string" ? { title } : {}),
            ...(rawOwnerId !== undefined && parsedOwner !== null ? { ownerId: parsedOwner } : {}),
        });
        res.json(await hydrateWorkflowEntry(wf));
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

router.put("/stage/:stageId", requiresAuth(), async (req, res) => {
    const stageId = Number(req.params.stageId);
    if (isNaN(stageId)) {
        res.status(400).json({ error: "Invalid stage id" });
        return;
    }

    const {
        title,
        description,
        dateDue,
        priority,
        status,
        employeeIds,
        contentIds,
    } = req.body;
    const statusParse = parseBodyServiceRequestStatus(status);
    if (statusParse.error) {
        res.status(400).json({ error: statusParse.error });
        return;
    }
    const parsedEmployeeIds = bodyIdArray(employeeIds);
    const parsedContentIds = bodyIdArray(contentIds);

    try {
        const existing = await serviceRequestRepo.getStageById(stageId);
        if (!existing) {
            res.status(404).json({ error: "Not found" });
            return;
        }

        let notifyFyiIds: number[] = [];
        if (parsedEmployeeIds !== undefined) {
            const oldSet = new Set(existing.employees.map((e) => e.id));
            const actor = await getEmployeeFromRequest(req);
            notifyFyiIds = parsedEmployeeIds.filter(
                (eid) => !oldSet.has(eid) && (actor == null || eid !== actor.id),
            );
        }

        const wasDone = existing.status === "done";

        const updated = await serviceRequestRepo.updateStage(stageId, {
            ...(typeof title === "string" ? { title } : {}),
            ...(typeof description === "string" ? { description } : {}),
            ...(dateDue !== undefined ? { dateDue: parseBodyDateDue(dateDue) } : {}),
            ...(priority !== undefined ? { priority: parseBodyPriority(priority) } : {}),
            ...(statusParse.value !== undefined ? { status: statusParse.value } : {}),
            ...(parsedEmployeeIds !== undefined ? { employeeIds: parsedEmployeeIds } : {}),
            ...(parsedContentIds !== undefined ? { contentIds: parsedContentIds } : {}),
        });

        const wfTitle = existing.workflow.title;

        if (notifyFyiIds.length) {
            const linkIds =
                parsedContentIds !== undefined && parsedContentIds.length
                    ? parsedContentIds
                    : existing.contents.map((c) => c.id);
            await notifyWorkflowAssignmentFyi(notificationRepo, wfTitle, [
                {
                    stageOrder: existing.stageOrder,
                    title: updated.title ?? existing.title,
                    employeeIds: notifyFyiIds,
                    contentIds: linkIds,
                },
            ]);
        }

        const nowDone = updated.status === "done";
        if (!wasDone && nowDone) {
            const next = await prisma.serviceRequestStage.findUnique({
                where: {
                    workflowId_stageOrder: {
                        workflowId: existing.workflowId,
                        stageOrder: existing.stageOrder + 1,
                    },
                },
                include: { employees: true, contents: true },
            });
            if (next) {
                await notifyStageReady(
                    notificationRepo,
                    wfTitle,
                    next.title,
                    next.stageOrder,
                    next.employees.map((e) => e.id),
                    next.contents.length ? next.contents.map((c) => c.id) : undefined,
                );
            }
        }

        const fresh = await serviceRequestRepo.getStageById(stageId);
        res.json(fresh ? await hydrateStageDeep(fresh) : updated);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

router.delete("/workflow/:workflowId", requiresAuth(), async (req, res) => {
    const id = Number(req.params.workflowId);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid workflow id" });
        return;
    }
    try {
        await serviceRequestRepo.deleteWorkflow(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Delete failed" });
    }
});

router.get("/:flag", requiresAuth(), async (req, res) => {
    const requests = await serviceRequestRepo.getAll();

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>Service workflows</h1>
            <script>
              const data = ${JSON.stringify(requests)};
              console.log("=== SERVICE WORKFLOWS ===", data);
            </script>
          </body>
        </html>
      `);
    } else {
        res.json(requests);
    }
});

export default router;
