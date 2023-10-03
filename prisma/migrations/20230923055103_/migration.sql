/*
  Warnings:

  - You are about to drop the column `expiryDate` on the `Credential` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Credential" DROP COLUMN "expiryDate",
ADD COLUMN     "expiry" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "refreshTokenExpiry" BIGINT NOT NULL DEFAULT 0;
