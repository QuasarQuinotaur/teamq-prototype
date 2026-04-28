import cron from "node-cron";

import { ContentReviewService } from "./ContentReviewService.ts";
import { NotificationRepository } from "../NotificationRepository";
import { ContentReviewRepository } from "../ContentReviewRepository.ts";

const service = new ContentReviewService(new ContentReviewRepository(), new NotificationRepository());

// async function runJob() {
//     try {
//         console.log("Running review notification job...");
//         await service.processReviewNotifications();
//     } catch (err) {
//         console.error("Review notification job failed:", err);
//     }
//
//     // run again in 1 hour
//     setTimeout(runJob, 1000 * 60 * 60);
// }
//
// // start loop
// setTimeout(runJob, 5000);


cron.schedule(
    "* */30 * * * *",
    async () => {
        try {
            console.log("Running review notification job...");
            await service.processReviewNotifications();
        } catch (err) {
            console.error("Review notification job failed:", err);
        }
    },
    {
        timezone: "America/New_York",
    }
);