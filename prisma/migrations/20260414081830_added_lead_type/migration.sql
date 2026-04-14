-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('COLD_EMAIL', 'JOB', 'REFERRAL', 'NETWORKING', 'RECRUITER', 'AGENCY');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "type" "LeadType" NOT NULL DEFAULT 'COLD_EMAIL';

-- CreateIndex
CREATE INDEX "leads_type_idx" ON "leads"("type");
