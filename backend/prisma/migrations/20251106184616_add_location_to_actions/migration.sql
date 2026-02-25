-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "equipment_manuals" (
    "id" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "equipmentNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "plant" TEXT NOT NULL,
    "location" TEXT,
    "manualFileName" TEXT NOT NULL,
    "manualFilePath" TEXT NOT NULL,
    "manualFileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "aiProcessedAt" TIMESTAMP(3),
    "aiExtractionData" JSONB,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_manuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "manualId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "interval" TEXT NOT NULL,
    "intervalHours" INTEGER,
    "intervalDays" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "estimatedDuration" TEXT,
    "requiredTools" TEXT,
    "safetyNotes" TEXT,
    "autoCreateWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "lastWorkOrderDate" TIMESTAMP(3),
    "nextWorkOrderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_parts" (
    "id" TEXT NOT NULL,
    "manualId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "quantity" INTEGER,
    "manufacturer" TEXT,
    "supplier" TEXT,
    "supplierPartNumber" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "minStockLevel" INTEGER,
    "currentStock" INTEGER,
    "replacementInterval" TEXT,
    "criticalPart" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications" (
    "id" TEXT NOT NULL,
    "manualId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "notes" TEXT,

    CONSTRAINT "specifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_manuals_plant_idx" ON "equipment_manuals"("plant");

-- CreateIndex
CREATE INDEX "equipment_manuals_equipmentName_idx" ON "equipment_manuals"("equipmentName");

-- CreateIndex
CREATE INDEX "maintenance_schedules_manualId_idx" ON "maintenance_schedules"("manualId");

-- CreateIndex
CREATE INDEX "spare_parts_manualId_idx" ON "spare_parts"("manualId");

-- CreateIndex
CREATE INDEX "spare_parts_partNumber_idx" ON "spare_parts"("partNumber");

-- CreateIndex
CREATE INDEX "specifications_manualId_idx" ON "specifications"("manualId");

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "equipment_manuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "equipment_manuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications" ADD CONSTRAINT "specifications_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "equipment_manuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
