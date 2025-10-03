/*
  Warnings:

  - You are about to drop the column `sphereId` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "sphereId",
ADD COLUMN     "sphere" INTEGER;
