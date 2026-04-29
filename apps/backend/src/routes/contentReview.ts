import { Router } from "express";
import pkg from "express-openid-connect";
import { ContentReviewService } from "../Service/ContentReviewService.ts";
import { NotificationRepository } from "../NotificationRepository.ts";
import { ContentReviewRepository } from "../ContentReviewRepository.ts";

const { requiresAuth } = pkg;

const router = Router();

const contentReviewRepository = new ContentReviewRepository();
const service = new ContentReviewService(contentReviewRepository, new NotificationRepository());

// =======================
// GET
// =======================

router.get("/", requiresAuth(), async (req, res) => {
    try {
        res.json(await contentReviewRepository.getAll());
    } catch (err) {
        console.error("🔥 REVIEW ERROR:", err);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

router.get("/content/:contentId", requiresAuth(), async (req, res) => {
    const id = Number(req.params.contentId);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid content id" });
    }

    try {
        res.json(await contentReviewRepository.getByContentId(id));
    } catch (err) {
        console.log("ERRROR GET:", err)
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// =======================
// POST
// =======================

router.post("/", requiresAuth(), async (req, res) => {
    try {
        const { contentId, stepName, date, employeeId, note } = req.body;

        const review = await service.createReview({
            contentId: Number(contentId),
            stepName,
            date: new Date(date),
            employeeId,
            note,
        });

        res.json({ success: true, review });
    } catch (err) {
        console.log("ERR:", err)
        res.status(500).json({ error: "Failed to create review" });
    }
});

// =======================
// PUT
// =======================

router.put("/:id", requiresAuth(), async (req, res) => {
    try {
        const id = Number(req.params.id);

        const updated = await service.updateReview(id, {
            stepName: req.body.stepName,
            note: req.body.note,
            date: req.body.date ? new Date(req.body.date) : undefined,
            status: req.body.status,
        });

        res.json({ success: true, review: updated });
    } catch (err) {
        res.status(500).json({ error: "Failed to update review" });
    }
});

// =======================
// DELETE
// =======================

router.delete("/:id", requiresAuth(), async (req, res) => {
    try {
        await service.deleteReview(Number(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete review" });
    }
});

export default router;