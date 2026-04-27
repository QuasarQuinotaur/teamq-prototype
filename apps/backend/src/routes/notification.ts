
import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";

import pkg from "express-openid-connect";

const { requiresAuth } = pkg;
import multer from "multer";

import { NotificationRepository } from "../NotificationRepository.ts";
import { getEmployeeIsAdmin } from "../util.ts";
import { Employee } from "db";
const notificationRepo = new NotificationRepository();

const router = Router();
const upload = multer();


// ===================================
// GET ===============================
// ===================================

router.get("/", requiresAuth(), async (req, res) => { //get all (by employee id)
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }

    const notifications = await notificationRepo.gettByEmpIdAll(employee.id);
    res.json(notifications);
});

router.get("/new", requiresAuth(), async (req, res) => { //get new
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }

    const notifications = await notificationRepo.gettByEmpIdNew(employee.id);

    if (notifications.length > 0) {
        await notificationRepo.markManyAsNotified(notifications.map(({ id }) => id));
    }

    res.json(
        notifications.map((notification) => ({
            ...notification,
            employeeWasNotified: true
        }))
    );
});

router.get("/unread", requiresAuth(), async (req, res) => { //get unread (dateRead == null)
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }

    const notifications = await notificationRepo.gettByEmpIdUnread(employee.id);
    res.json(notifications);
});

router.get("/read", requiresAuth(), async (req, res) => { //get read
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }

    const notifications = await notificationRepo.gettByEmpIdRead(employee.id);
    res.json(notifications);
});

router.get("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
    }

    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            return res.status(404).json({ error: "No linked employee account found" });
        }

        const notification = await notificationRepo.gettById(id);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const isOwner = notification.employeeNotifiedID === employee.id;
        const isAdmin = await getEmployeeIsAdmin(employee);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to view this notification" });
        }

        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Fetch failed" });
    }
});


// ====================================
// POST ===============================
// ====================================

// Only admins can create custom notifications via this route.
// System-generated notifications are created internally (not through this endpoint).
router.post("/upload", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            return res.status(404).json({ error: "No linked employee account found" });
        }

        // only admins
        if (!getEmployeeIsAdmin(employee)) {
            return res.status(403).json({
                error: "Must be an admin to send a custom notification"
            });
        }

        const { type, employeeIds, contentIds, customMsg } = req.body;

        // validate inputs
        if (
            !type?.trim() ||
            !Array.isArray(employeeIds) ||
            employeeIds.length === 0
        ) {
            return res.status(400).json({
                error: "Missing required fields (type, employeeIds[])"
            });
        }

        const created = await notificationRepo.createMany({
            type: type.trim(),
            employeeIds,
            contentIds,
            customMsg,
        });

        res.json({
            success: true,
            count: created.length,
            notifications: created,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
});

// ===================================
// PUT ===============================
// ===================================
// mark as notified (removes from "new")
router.put("/update/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const notification = await notificationRepo.gettById(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const isOwner = notification.employeeNotifiedID === employee.id;
        const isAdmin = await getEmployeeIsAdmin(employee);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to update this notification" });
        }

        const notificationOld = await notificationRepo.update(id, {
            employeeWasNotified: true
        });
        res.json(notificationOld);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

// mark as read (used by notification detail view)
router.put("/read/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const notification = await notificationRepo.gettById(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const isOwner = notification.employeeNotifiedID === employee.id;
        const isAdmin = await getEmployeeIsAdmin(employee);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to update this notification" });
        }

        const notificationRead = await notificationRepo.update(id, {
            dateRead: new Date(),
            employeeWasNotified: true
        });
        res.json(notificationRead);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

router.put("/unread/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
    }

    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            return res.status(404).json({ error: "No linked employee account found" });
        }

        const notification = await notificationRepo.gettById(id);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const isOwner = notification.employeeNotifiedID === employee.id;
        const isAdmin = await getEmployeeIsAdmin(employee);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to update this notification" });
        }

        const notificationUnread = await notificationRepo.update(id, {
            dateRead: null,
            employeeWasNotified: true
        });
        res.json(notificationUnread);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

// ======================================
// DELETE ===============================
// ======================================

router.delete("/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
    }

    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            return res.status(404).json({ error: "No linked employee account found" });
        }

        const notification = await notificationRepo.gettById(id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const isOwner = notification.employeeNotifiedID === employee.id;
        const isAdmin = await getEmployeeIsAdmin(employee);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to delete this notification" });
        }

        await notificationRepo.delete(id);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Delete failed",
        });
    }
});

export default router;
