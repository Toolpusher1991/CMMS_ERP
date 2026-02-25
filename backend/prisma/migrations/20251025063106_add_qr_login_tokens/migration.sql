/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "qrToken" TEXT,
ADD COLUMN     "qrTokenCreatedAt" TIMESTAMP(3),
ADD COLUMN     "qrTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "qrTokenLastUsed" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_qrToken_key" ON "users"("qrToken");
