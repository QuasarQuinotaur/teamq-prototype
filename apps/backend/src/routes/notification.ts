import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import {
    uploadBuffer,
    getSignedUrl,
    deleteFile,
    downloadBuffer,
} from "../lib/supabase.ts";
import { pdf } from "pdf-to-img";
import pkg from "express-openid-connect";
import { prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";

import { NotificationRepository } from "../NotificationRepository.ts";
import {exec} from "node:child_process";
import {readFile} from "fs/promises";
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
    res.json(notifications);
});

router.get("/old", requiresAuth(), async (req, res) => { //get old
    const employee = await getEmployeeFromRequest(req);

    if (!employee) {
        res.status(404).json({ error: "No linked employee account found" });
        return;
    }

    const notifications = await notificationRepo.gettByEmpIdOld(employee.id);
    res.json(notifications);
});

router.get("/:id", requiresAuth(), async (req, res) => { // get by id
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid id" });
    }

    const notification = await notificationRepo.gettById(id);
    res.json(notification);
});

// ====================================
// POST ===============================
// ====================================

router.post("/upload", requiresAuth(), async (req, res) => { // create new content
    //date sent is now
    //date read is undefined
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const { type, dateSent, dateRead, employeeNotifiedID, contentIds } = req.body;

        if (
            !type?.trim() ||
            !employeeNotifiedID
        ) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const hasRead = !!req.dateRead;
        if (hasRead) {
            res.status(400).json({ error: "Cant send a read notification." });
            return;
        }

        const created = await notificationRepo.create({
            type: type.trim(),
            dateSent: new Date(),
            dateRead: null,
            contentIds,
            employeeNotifiedID: employeeNotifiedID, // see next issue
        });

        res.json({
            success: true,
            content: created,
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

router.put("/upload/:id", requiresAuth(), async (req, res) => {
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
        const isAdmin = employee.jobPosition === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Not authorized to update this notification" });
        }

        const notificationOld = await notificationRepo.update(id, {
            dateRead: new Date() //set to now
        });
        res.json(notificationOld);
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
        const isAdmin = employee.jobPosition === "admin";

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
