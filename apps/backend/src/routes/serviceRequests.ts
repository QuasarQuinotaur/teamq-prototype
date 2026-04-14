import { Router } from "express";
import { ServiceRequestRepository } from "../ServiceRequestRepository.ts";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;

const router = Router();
const serviceRequestRepo = new ServiceRequestRepository();

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

// GET /api/assigned/:flag
// flag=1 returns an HTML debug page, flag=0 returns JSON with full details
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
        res.json(assigned);
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
    const { ownerId, description, employeeIds, contentIds } = req.body;
    if (!ownerId) {
        res.status(400).json({ error: "ownerId is required" });
        return;
    }
    try {
        const request = await serviceRequestRepo.create({ ownerId, description, employeeIds, contentIds });
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
    const { description, ownerId, employeeIds, contentIds } = req.body;
    try {
        const request = await serviceRequestRepo.update(id, { description, ownerId, employeeIds, contentIds });
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
