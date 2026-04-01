/*
  Warnings:

  - You are about to drop the column `name` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "name",
ADD COLUMN     "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateUpdated" TIMESTAMP(3),
ADD COLUMN     "ownerId" INTEGER,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
