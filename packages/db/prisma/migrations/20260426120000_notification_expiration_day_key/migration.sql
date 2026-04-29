ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS "contentExpirationDayKey" TEXT;

CREATE INDEX IF NOT EXISTS "Notification_employeeNotifiedID_type_contentExpirationDayKey_idx" ON "Notification"("employeeNotifiedID", "type", "contentExpirationDayKey");
