-- Remove the DB-level DEFAULT NOW() from dateRead that was left behind by a
-- previous prisma db push. This was causing every new notification to be
-- created with dateRead already set (making them immediately appear as read).
-- dateRead should only be set explicitly when a user opens a notification.
ALTER TABLE "Notification" ALTER COLUMN "dateRead" DROP DEFAULT;
