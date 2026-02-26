-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('LINKEDIN', 'SLACK', 'FACEBOOK', 'X', 'COMPANY_WEBSITE', 'REFERRAL', 'JOB_BOARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationMethod" AS ENUM ('EMAIL', 'WEB_PORTAL', 'LINKEDIN_EASY_APPLY', 'REFERRAL');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('YES', 'NO', 'PENDING');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'BEHAVIORAL', 'FINAL');

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "source" "JobSource" NOT NULL,
    "application_method" "ApplicationMethod" NOT NULL,
    "job_posting_url" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_currency" TEXT DEFAULT 'USD',
    "location" TEXT,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "response_received" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "date_found" DATE,
    "date_applied" DATE,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_interviews" (
    "id" TEXT NOT NULL,
    "job_application_id" TEXT NOT NULL,
    "interview_type" "InterviewType" NOT NULL,
    "round_number" INTEGER NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "location" TEXT,
    "interviewer_names" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "job_interviews_job_application_id_idx" ON "job_interviews"("job_application_id");

-- CreateIndex
CREATE INDEX "job_interviews_scheduled_at_idx" ON "job_interviews"("scheduled_at");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_interviews" ADD CONSTRAINT "job_interviews_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
