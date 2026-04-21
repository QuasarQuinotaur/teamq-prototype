import { Router } from "express";
import { getEmployeeFromRequest } from "../app.ts";
import { uploadBuffer, getSignedUrl, deleteFile } from "../lib/supabase.ts";
import pkg from "express-openid-connect";
import { prisma } from "db";
const { requiresAuth } = pkg;
import multer from "multer";

import { ContentRepository } from "../ContentRepository.ts";
const contentRepo = new ContentRepository();

const router = Router();
const upload = multer();



// ===================================
// POST ===============================
// ===================================
router.post("/upload-photo", requiresAuth(), upload.single("file"), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: "Photo file is required" });
            return;
        }

        if (!req.file.mimetype.startsWith("image/")) {
            res.status(400).json({ error: "Only image files are allowed" });
            return;
        }

        const uniqueName = `user-${employee.id}-${Date.now()}.png`;

        let uploaded;
        try {
            uploaded = await uploadBuffer(
                req.file.buffer,
                uniqueName,
                req.file.mimetype
            );
            console.log("uploaded:", uploaded);
        } catch (err) {
            console.error("UPLOAD BUFFER ERROR:", err);
            throw err;
        }

        const photo = await prisma.userPhoto.upsert({
            where: { ownerId: employee.id },
            update: {
                path: uploaded.path,
            },
            create: {
                ownerId: employee.id,
                path: uploaded.path,
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            photo,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Photo upload failed",
        });
    }
});

// ===================================
// DELETE ===============================
// ===================================
router.delete("/photo/:id", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const photo = await prisma.userPhoto.findUnique({
            where: { ownerId: employee.id },
        });
        if (!photo) {
            res.status(404).json({ error: "No profile photo found" });
            return;
        }
        await deleteFile(photo.path);
        await prisma.userPhoto.delete({
            where: { ownerId: employee.id },
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Delete failed",
        });
    }
});

// ===================================
// GET ===============================
// ===================================

// photo from signed in employee
router.get("/photo", requiresAuth(), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);
        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }
        const photo = await prisma.userPhoto.findUnique({
            where: { ownerId: employee.id },
        });
        if (!photo) {
            res.status(404).json({ error: "No profile photo found" });
            return;
        }
        const signedUrl = await getSignedUrl(photo.path);
        res.json({
            success: true,
            url: signedUrl,
            photo,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load profile photo",
        });
    }
});

// photo from employee ID
router.get("/photo/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const photo = await prisma.userPhoto.findUnique({
            where: { ownerId: id },
        });
        if (!photo) {
            res.status(404).json({ error: "No profile photo found" });
            return;
        }
        const signedUrl = await getSignedUrl(photo.path);
        res.json({
            success: true,
            url: signedUrl,
            photo,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to find profile photo",
        });
    }
});

export default router;
