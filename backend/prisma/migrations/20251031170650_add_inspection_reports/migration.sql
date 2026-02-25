-- CreateTable
CREATE TABLE "inspection_reports" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "plant" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspector" TEXT NOT NULL,
    "inspectorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "overallResult" TEXT,
    "inspectorSignature" TEXT,
    "supervisorSignature" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "generalNotes" TEXT,
    "recommendations" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_sections" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "inspection_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_items" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'CHECKBOX',
    "isChecked" BOOLEAN,
    "measurementValue" TEXT,
    "measurementUnit" TEXT,
    "textValue" TEXT,
    "rating" INTEGER,
    "result" TEXT,
    "notes" TEXT,
    "minValue" TEXT,
    "maxValue" TEXT,
    "referenceValue" TEXT,

    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_attachments" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspection_reports_reportNumber_key" ON "inspection_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "inspection_reports_plant_idx" ON "inspection_reports"("plant");

-- CreateIndex
CREATE INDEX "inspection_reports_type_idx" ON "inspection_reports"("type");

-- CreateIndex
CREATE INDEX "inspection_reports_status_idx" ON "inspection_reports"("status");

-- CreateIndex
CREATE INDEX "inspection_reports_inspectionDate_idx" ON "inspection_reports"("inspectionDate");

-- CreateIndex
CREATE INDEX "inspection_sections_reportId_idx" ON "inspection_sections"("reportId");

-- CreateIndex
CREATE INDEX "inspection_items_sectionId_idx" ON "inspection_items"("sectionId");

-- CreateIndex
CREATE INDEX "inspection_attachments_reportId_idx" ON "inspection_attachments"("reportId");

-- AddForeignKey
ALTER TABLE "inspection_sections" ADD CONSTRAINT "inspection_sections_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "inspection_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "inspection_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_attachments" ADD CONSTRAINT "inspection_attachments_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "inspection_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
