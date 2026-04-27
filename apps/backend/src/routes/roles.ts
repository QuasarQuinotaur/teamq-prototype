import { Router } from "express";
import { Employee, prisma } from "db";
import { getEmployeeFromRequest } from "../app";
import { getEmployeeIsAdmin, getEmployeePermissionLevel, getPermissionLevelIsAdmin } from "../util";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;

const router = Router();

/** Whether this employee is a higher permission than the level. */
async function isHigherPermissionLevel(employee: Employee, permissionLevel: number): Promise<boolean> {
    const employeePermissionLevel = await getEmployeePermissionLevel(employee)
    if (!getPermissionLevelIsAdmin(employeePermissionLevel)) {
        return false
    }
    return employeePermissionLevel > permissionLevel
}

/** Whether this employee is equal to or higher than permission to the level. */
async function isAtLeastPermissionLevel(employee: Employee, permissionLevel: number): Promise<boolean> {
    const employeePermissionLevel = await getEmployeePermissionLevel(employee)
    if (!getPermissionLevelIsAdmin(employeePermissionLevel)) {
        return false
    }
    return employeePermissionLevel >= permissionLevel
}

/** Whether this employee can create a role at the permission level. */
async function canCreateRole(employee: Employee, permissionLevel: number): Promise<boolean> {
    return await isHigherPermissionLevel(employee, permissionLevel)
}

/** Whether this employee can update *any* aspect of a role at the permission level. */
async function canUpdateRole(employee: Employee, permissionLevel: number): Promise<boolean> {
    return await isAtLeastPermissionLevel(employee, permissionLevel)
}


/** Whether this employee can delete a role at the permission level. */
async function canDeleteRoleOfPermissionLevel(employee: Employee, permissionLevel: number): Promise<boolean> {
    return await isHigherPermissionLevel(employee, permissionLevel)
}


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

        const { key, name, permissionLevel } = req.body
        if (!key.trim() || !name.trim() || permissionLevel === null) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const canCreate = await canCreateRole(employee, permissionLevel);    
        if (!canCreate) {
            return res.status(403).json({ error: "Not authorized to create role of permission level" });
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
                permissionLevel: permissionLevel,
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

        const existingRole = await prisma.role.findFirst({
            where: {
                id: roleId
            },
        });
        if (!existingRole) {
            res.status(404).json({ error: "Role not found" });
            return;
        }
        const canUpdateExisting = await canUpdateRole(employee, existingRole.permissionLevel);    
        if (!canUpdateExisting) {
            return res.status(403).json({ error: "Not authorized to update role" });
        }

        const { name, permissionLevel } = req.body;
        if (!name.trim()) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (permissionLevel && permissionLevel > existingRole.permissionLevel) {
            const canUpdateTo = await canCreateRole(employee, permissionLevel);    
            if (!canUpdateTo) {
                return res.status(403).json({ error: "Not authorized to update to permission level" });
            }
        }

        const updatedRole = await prisma.role.update({
            where: {
                id: roleId
            },
            data: {
                name: name.trim(),
                ...(permissionLevel ? {permissionLevel} : {})
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

        const existingRole = await prisma.role.findFirst({
            where: {
                id: roleId
            },
        });
        if (!existingRole) {
            res.status(404).json({ error: "Role not found" });
            return;
        }
        const canDeleteExisting = await canDeleteRoleOfPermissionLevel(employee, existingRole.permissionLevel);    
        if (!canDeleteExisting) {
            return res.status(403).json({ error: "Not authorized to delete role" });
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