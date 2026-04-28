-- Repair migration: fixes DB drift when _prisma_migrations is ahead of the actual schema
-- (e.g. dateReview was never created but an older migration is already recorded as applied).
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "dateReview" TIMESTAMP(3);
