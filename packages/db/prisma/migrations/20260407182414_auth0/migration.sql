/*
  Warnings:

  - You are about to drop the column `url` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Employee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[auth0Id]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contentType` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expirationDate` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobPosition` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerName` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobPosition` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "url",
ADD COLUMN     "contentType" TEXT NOT NULL,
ADD COLUMN     "expirationDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jobPosition" TEXT NOT NULL,
ADD COLUMN     "link" TEXT NOT NULL,
ADD COLUMN     "ownerName" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "dob",
DROP COLUMN "name",
ADD COLUMN     "auth0Id" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "jobPosition" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "creatorID" INTEGER NOT NULL,
    "requesteeID" INTEGER NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_auth0Id_key" ON "Employee"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_creatorID_fkey" FOREIGN KEY ("creatorID") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_requesteeID_fkey" FOREIGN KEY ("requesteeID") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
