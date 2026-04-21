/*
  Warnings:

  - You are about to drop the column `dateOfBirth` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "dateOfBirth",
ADD COLUMN     "dob" TIMESTAMP(3);
