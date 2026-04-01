/*
  Warnings:

  - Made the column `dateUpdated` on table `Content` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ownerId` on table `Content` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `Content` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `Content` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dob` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_ownerId_fkey";

-- AlterTable
ALTER TABLE "Content" ALTER COLUMN "dateUpdated" SET NOT NULL,
ALTER COLUMN "ownerId" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "url" SET NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "dob" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
