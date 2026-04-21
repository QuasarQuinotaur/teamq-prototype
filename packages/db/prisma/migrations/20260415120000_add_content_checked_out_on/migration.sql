-- AlterTable
ALTER TABLE "Content" ADD COLUMN "checkedOutOn" TIMESTAMP(3);

-- Backfill: existing checkouts get a timestamp so the 5-minute stale rule can apply
UPDATE "Content" SET "checkedOutOn" = NOW() WHERE "isCheckedOut" = true AND "checkedOutOn" IS NULL;

-- CreateIndex
CREATE INDEX "Content_isCheckedOut_checkedOutOn_idx" ON "Content"("isCheckedOut", "checkedOutOn");
