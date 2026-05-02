import { Router } from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;
import {
    EmployeeRepository,
    EmployeeDeleteBlockedByAssignmentsError,
} from "../EmployeeRepository.ts";
import { getEmployeeFromRequest } from "../app.ts";
import { getEmployeeIsAdmin } from "../util.ts";
import { tryGetSignedUrl } from "../lib/supabase.ts";
import { prisma } from "db";
const employeeRepo = new EmployeeRepository();

function isPrismaRecordNotFound(err: unknown): boolean {
    return (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2025"
    );
}

const router = Router();


//!===================================
//! GET ===============================
//! ===================================

//gets all employees
router.get("/", requiresAuth(), async (req, res) => {
    const employees = await employeeRepo.getAll();

    const employeesWithPhotos = await Promise.all(
        employees.map(async (e) => {
            let image: string | undefined;

            // find photo for this employee
            const photo = await prisma.userPhoto.findUnique({
                where: { ownerId: e.id },
            });

            if (photo?.path) {
                image = await tryGetSignedUrl(photo.path);
            }

            return {
                ...e,
                image,
            };
        })
    );

    res.json(employeesWithPhotos);
});

//gets employee of id
//if flag == 1, sends html of employee information
//if flag = 0, doesnt do that
router.get("/:id/:flag", async (req, res) => {
    const id = Number(req.params.id);
    const employee = await employeeRepo.getById(id);
    if (employee) {
        console.log(`[${employee.id}] ${employee.firstName} ${employee.lastName} | ${employee.jobPosition} | DOB: ${employee.dateOfBirth.toDateString()}`);
    }

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>${employee?.firstName} ${employee?.lastName}</h1>
            <p>${employee?.jobPosition}</p>
            <p>${employee?.dateOfBirth.toDateString()}</p>
          </body>
        </html>
      `);
    } else {
        res.json(employee);
    }
});

//! ====================================
//! POST ===============================
//! ====================================

// Creates/post a new employee (requires auth, validates input, saves to DB)
router.post("/", requiresAuth(), async (req, res) => {
    const { firstName, lastName, email, dateOfBirth, jobPosition } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !dateOfBirth || !jobPosition?.trim()) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    try {
        const employee = await employeeRepo.create({
            firstName,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            jobPosition,
        });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Create failed" });
    }
});


//! ===================================
//! PUT ===============================
//! ===================================

//edits employee based on id
router.put("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const { firstName, lastName, email, dateOfBirth, jobPosition } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !dateOfBirth || !jobPosition?.trim()) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    try {
        const employee = await employeeRepo.update(id, {
            firstName,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            jobPosition,
        });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

//! ======================================
//! DELETE ===============================
//! ======================================

//deletes employee based on id
router.delete("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const actor = await getEmployeeFromRequest(req);
    if (!actor) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }
    if (!(await getEmployeeIsAdmin(actor))) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    try {
        await employeeRepo.deleteAsAdmin(id, actor.id);
        res.json({ success: true });
    } catch (err) {
        if (err instanceof EmployeeDeleteBlockedByAssignmentsError) {
            res.status(409).json({ error: err.message, code: err.code });
            return;
        }
        if (isPrismaRecordNotFound(err)) {
            res.status(404).json({ error: "Employee not found" });
            return;
        }
        res.status(500).json({
            error: err instanceof Error ? err.message : "Delete failed",
        });
    }
});



export default router
