ALTER TABLE "Content"
ADD COLUMN IF NOT EXISTS "hasBeenNotifiedExpiringSoon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hasBeenNotifiedOfExpiration" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "Notification_employeeNotifiedID_type_contentExpirationDayKey_idx";

ALTER TABLE "Notification" DROP COLUMN IF EXISTS "contentExpirationDayKey";
