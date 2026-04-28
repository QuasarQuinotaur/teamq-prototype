-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;

-- Partial unique: one global row per tagName (per plan)
CREATE UNIQUE INDEX "Tag_tagName_global_key" ON "Tag"("tagName") WHERE "isGlobal" = true;
