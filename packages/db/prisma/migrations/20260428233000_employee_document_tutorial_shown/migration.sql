-- Drop legacy column if it was applied locally (optional).
ALTER TABLE "UserSettings" DROP COLUMN IF EXISTS "documentTutorialCompleted";

ALTER TABLE "Employee" ADD COLUMN "documentTutorialShown" BOOLEAN NOT NULL DEFAULT false;
