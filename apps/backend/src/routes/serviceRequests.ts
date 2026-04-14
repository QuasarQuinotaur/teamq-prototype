import { Router } from "express";
import { ServiceRequestRepository } from "../ServiceRequestRepository.ts";
import { getSignedUrl } from "../lib/supabase.ts";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;

const router = Router();
const serviceRequestRepo = new ServiceRequestRepository();

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
    emp: T
): Promise<Omit<T, "userPhoto"> & { profileImageUrl?: string }> {
    const { userPhoto, ...rest } = emp;
    let profileImageUrl: string | undefined;
    if (userPhoto?.path) {
        try {
            profileImageUrl = await getSignedUrl(userPhoto.path, 3600);
        } catch (err) {
            console.error("Profile image signed URL failed", emp.id, err);
        }
    }
    return { ...rest, profileImageUrl };
}

// GET /api/servicereqs/:flag
// flag=1 returns an HTML debug page, flag=0 returns JSON
router.get("/:flag", requiresAuth(), async (req, res) => {
    const requests = await serviceRequestRepo.getAll();

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>Service Request</h1>
            <script>
              const data = ${JSON.stringify(requests)};
              console.log("=== SERVICE REQUESTS ===", data);
            </script>
          </body>
        </html>
      `);
    } else {
        res.json(requests);
    }
});

// GET /api/servicereqs/assigned/:flag
// flag=1 returns an HTML debug page, flag=0 returns JSON with full details (profile image URLs for people)
router.get("/assigned/:flag", requiresAuth(), async (req, res) => {
    const assigned = await serviceRequestRepo.getAllWithDetails();

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>Assigned Requests</h1>
            <script>
              const data = ${JSON.stringify(assigned)};
              console.log("=== ASSIGNED ===", data);
            </script>
          </body>
        </html>
      `);
    } else {
        const withUrls = await Promise.all(
            assigned.map(async (sr) => {
                const owner = await employeeWithProfileUrl(sr.owner);
                const employees = await Promise.all(
                    sr.employees.map((e) => employeeWithProfileUrl(e))
                );
                return { ...sr, owner, employees };
            })
        );
        res.json(withUrls);
    }
});

// GET /api/servicereqs/detail/:id
// get a single service request with full details
router.get("/detail/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const request = await serviceRequestRepo.getById(id);
        if (!request) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch" });
    }
});

// POST /api/servicereqs
// create a new service request
router.post("/", requiresAuth(), async (req, res) => {
    const { ownerId, title, description, dateDue, priority, employeeIds, contentIds } = req.body;
    if (!ownerId) {
        res.status(400).json({ error: "ownerId is required" });
        return;
    }
    try {
        const request = await serviceRequestRepo.create({
            ownerId,
            title: typeof title === "string" ? title : undefined,
            description: typeof description === "string" ? description : undefined,
            dateDue: parseBodyDateDue(dateDue),
            priority: parseBodyPriority(priority),
            employeeIds,
            contentIds,
        });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Create failed" });
    }
});

// PUT /api/servicereqs/:id
// update a service request
router.put("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const { title, description, dateDue, priority, status, ownerId, employeeIds, contentIds } = req.body;
    const toIdList = (raw: unknown): number[] | undefined => {
        if (!Array.isArray(raw)) return undefined;
        return raw
            .map((x) => Number(x))
            .filter((n) => !Number.isNaN(n));
    };
    const statusParse = parseBodyServiceRequestStatus(status);
    if (statusParse.error) {
        res.status(400).json({ error: statusParse.error });
        return;
    }
    try {
        const request = await serviceRequestRepo.update(id, {
            title: typeof title === "string" ? title : undefined,
            description: typeof description === "string" ? description : undefined,
            dateDue: parseBodyDateDue(dateDue),
            priority: parseBodyPriority(priority),
            status: statusParse.value,
            ownerId: typeof ownerId === "number" && !Number.isNaN(ownerId) ? ownerId : undefined,
            employeeIds: toIdList(employeeIds),
            contentIds: toIdList(contentIds),
        });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

// DELETE /api/servicereqs/:id
// delete a service request
router.delete("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        await serviceRequestRepo.delete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Delete failed" });
    }
});

export default router;
