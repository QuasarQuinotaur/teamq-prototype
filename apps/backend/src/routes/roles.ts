import { Router } from "express";
import { prisma } from "db";
import { getEmployeeFromRequest } from "../app";
import { getEmployeeIsAdmin } from "../util";
import { requiresAuth } from "express-openid-connect";

const router = Router();


// ===================================
// GET /api/roles — fetch all roles
// ===================================
router.get("/", requiresAuth(), async (req, res) => {
    try {
        const roles = await prisma.role.findMany({ orderBy: { id: "asc"} });
        res.json({
            success: true,
            roles: roles
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to get roles",
        });
    }
});


// ===================================
// POST /api/roles — create role (Admin only)
// ===================================
router.post("/", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const isAdmin = getEmployeeIsAdmin(employee);    
        if (!isAdmin) {
            return res.status(403).json({ error: "Not authorized to create roles" });
        }

        const { key, name, permission } = req.body
        if (!key.trim() || !name.trim()) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const roleOfKey = await prisma.role.findUnique({
            where: {key: key}
        })
        if (roleOfKey !== null) {
            return res.status(400).json({ error: "This role already exists" });
        }

        const role = await prisma.role.create({
            data: {
                key: key.trim(),
                name: name.trim(),
                permission: permission && permission.trim(),
            },
        });
        res.json({
            success: true,
            role: role
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create role",
        });
    }
});


// ===================================
// PUT /api/roles/:id — update role by ID (Admin only)
// ===================================
router.put("/:id", requiresAuth(), async (req, res) => {
    const roleId = Number(req.params.id);
    if (Number.isNaN(roleId)) {
        res.status(400).json({ error: "Invalid role id" });
        return;
    }
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const isAdmin = getEmployeeIsAdmin(employee);    
        if (!isAdmin) {
            return res.status(403).json({ error: "Not authorized to create roles" });
        }

        const existingRole = await prisma.role.findFirst({
            where: {
                id: roleId
            },
        });
        if (!existingRole) {
            res.status(404).json({ error: "Role not found" });
            return;
        }

        const { name, permission } = req.body;
        if (!name.trim()) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const updatedRole = await prisma.role.update({
            where: {
                id: roleId
            },
            data: {
                name: name.trim(),
                ...(permission ? {permission: permission.trim()} : {})
            },
        });
        res.json({
            success: true,
            role: updatedRole
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create role",
        });
    }
});


// ===================================
// DELETE /api/roles/:id — delete role by ID (Admin only)
// ===================================
router.delete("/:id", requiresAuth(), async (req, res) => {
    const roleId = Number(req.params.id);
    if (Number.isNaN(roleId)) {
        res.status(400).json({ error: "Invalid role id" });
        return;
    }
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const isAdmin = getEmployeeIsAdmin(employee);    
        if (!isAdmin) {
            return res.status(403).json({ error: "Not authorized to create roles" });
        }

        const existingRole = await prisma.role.findFirst({
            where: {
                id: roleId
            },
        });
        if (!existingRole) {
            res.status(404).json({ error: "Role not found" });
            return;
        }
        
        await prisma.role.delete({
            where: {
                id: roleId
            }
        })
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create role",
        });
    }
});

export default router;