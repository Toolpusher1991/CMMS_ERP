/*
  Warnings:

  - A unique constraint covering the columns `[ticketNumber]` on the table `failure_reports` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ticketNumber` to the `failure_reports` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add column as nullable first
ALTER TABLE "failure_reports" ADD COLUMN "ticketNumber" TEXT;

-- Step 2: Generate ticket numbers for existing records using a simple incrementing approach
-- We'll use a CTE with ROW_NUMBER to assign unique numbers
WITH numbered_reports AS (
  SELECT 
    id,
    plant || '-' || TO_CHAR("createdAt", 'YYYYMM') || '-' || 
    LPAD(
      ROW_NUMBER() OVER (
        PARTITION BY plant, TO_CHAR("createdAt", 'YYYYMM') 
        ORDER BY "createdAt"
      )::TEXT,
      3,
      '0'
    ) AS ticket
  FROM "failure_reports"
  WHERE "ticketNumber" IS NULL
)
UPDATE "failure_reports" fr
SET "ticketNumber" = nr.ticket
FROM numbered_reports nr
WHERE fr.id = nr.id;

-- Step 3: Make the column required
ALTER TABLE "failure_reports" ALTER COLUMN "ticketNumber" SET NOT NULL;

-- Step 4: Create unique index
CREATE UNIQUE INDEX "failure_reports_ticketNumber_key" ON "failure_reports"("ticketNumber");
