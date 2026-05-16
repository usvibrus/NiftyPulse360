-- AlterTable
ALTER TABLE "StockEvent" ADD COLUMN     "aiAnalysis" TEXT,
ADD COLUMN     "avgVolume" BIGINT,
ADD COLUMN     "faqContent" JSONB,
ADD COLUMN     "niftyChange" DOUBLE PRECISION,
ADD COLUMN     "sectorChange" DOUBLE PRECISION,
ADD COLUMN     "week52High" DOUBLE PRECISION,
ADD COLUMN     "week52Low" DOUBLE PRECISION;
