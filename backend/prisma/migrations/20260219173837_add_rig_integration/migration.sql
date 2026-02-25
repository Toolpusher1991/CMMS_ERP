-- AlterTable: Add Asset Integrity fields to rigs
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "contractStatus" TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "certifications" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "generalInfo" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "inspections" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "issues" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "rigs" ADD COLUMN IF NOT EXISTS "improvements" TEXT NOT NULL DEFAULT '[]';

-- AlterTable: Add rigId to actions
ALTER TABLE "actions" ADD COLUMN IF NOT EXISTS "rigId" TEXT;

-- AlterTable: Add rigId to projects
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "rigId" TEXT;

-- AlterTable: Add rigId to failure_reports
ALTER TABLE "failure_reports" ADD COLUMN IF NOT EXISTS "rigId" TEXT;

-- AddForeignKey: Action -> Rig
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'actions_rigId_fkey') THEN
    ALTER TABLE "actions" ADD CONSTRAINT "actions_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "rigs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: Project -> Rig
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_rigId_fkey') THEN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "rigs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: FailureReport -> Rig
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'failure_reports_rigId_fkey') THEN
    ALTER TABLE "failure_reports" ADD CONSTRAINT "failure_reports_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "rigs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "actions_rigId_idx" ON "actions"("rigId");
CREATE INDEX IF NOT EXISTS "projects_rigId_idx" ON "projects"("rigId");
CREATE INDEX IF NOT EXISTS "failure_reports_rigId_idx" ON "failure_reports"("rigId");
