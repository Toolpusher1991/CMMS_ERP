-- CreateTable
CREATE TABLE "tender_configurations" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "clientName" TEXT,
    "location" TEXT,
    "projectDuration" TEXT,
    "selectedRig" JSONB NOT NULL,
    "selectedEquipment" JSONB NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "isUnderContract" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tender_configurations_createdBy_idx" ON "tender_configurations"("createdBy");

-- CreateIndex
CREATE INDEX "tender_configurations_isUnderContract_idx" ON "tender_configurations"("isUnderContract");

-- AddForeignKey
ALTER TABLE "tender_configurations" ADD CONSTRAINT "tender_configurations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
