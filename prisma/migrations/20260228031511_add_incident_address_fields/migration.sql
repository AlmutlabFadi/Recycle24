-- AlterTable
ALTER TABLE "SafetyIncidentReport" ADD COLUMN     "city" TEXT,
ADD COLUMN     "governorate" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationAccuracy" INTEGER,
ADD COLUMN     "locationUrl" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "street" TEXT;

-- AlterTable
ALTER TABLE "SafetyTrainingSession" ADD COLUMN     "contactWhatsapp" TEXT;
