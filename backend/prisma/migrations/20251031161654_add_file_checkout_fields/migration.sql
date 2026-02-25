-- AlterTable
ALTER TABLE "files" ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutBy" TEXT,
ADD COLUMN     "checkedOutByName" TEXT;
