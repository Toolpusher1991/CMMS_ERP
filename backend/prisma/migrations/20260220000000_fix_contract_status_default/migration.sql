-- Fix: Change default contractStatus from 'idle' to 'stacked'
-- The original migration set DEFAULT 'idle' but the valid statuses are: stacked, operational, overhaul
ALTER TABLE "rigs" ALTER COLUMN "contractStatus" SET DEFAULT 'stacked';

-- Update any existing rigs that still have the invalid 'idle' status
UPDATE "rigs" SET "contractStatus" = 'stacked' WHERE "contractStatus" = 'idle';
