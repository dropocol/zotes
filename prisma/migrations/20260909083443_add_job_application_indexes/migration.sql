-- DropIndex
DROP INDEX "job_applications_status_idx";

-- DropIndex
DROP INDEX "job_applications_user_id_idx";

-- CreateIndex
CREATE INDEX "job_applications_user_id_status_idx" ON "job_applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "job_applications_user_id_date_applied_idx" ON "job_applications"("user_id", "date_applied");

-- CreateIndex
CREATE INDEX "job_applications_user_id_created_at_idx" ON "job_applications"("user_id", "created_at");
