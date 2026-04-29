-- Service requests only use statuses: to-do, done
ALTER TABLE "ServiceRequest"
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'to-do';

UPDATE "ServiceRequest"
SET "status" = 'done'
WHERE LOWER(TRIM("status")) IN ('completed', 'complete');

UPDATE "ServiceRequest"
SET "status" = 'to-do'
WHERE "status" NOT IN ('to-do', 'done');

ALTER TABLE "ServiceRequest"
DROP CONSTRAINT IF EXISTS "ServiceRequest_status_check";

ALTER TABLE "ServiceRequest"
    ADD CONSTRAINT "ServiceRequest_status_check"
        CHECK ("status" IN ('to-do', 'done'));