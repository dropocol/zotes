-- CreateTable
CREATE TABLE "mindmaps" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "data" JSONB NOT NULL,
    "project_id" TEXT,
    "user_id" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mindmaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mindmaps_user_id_idx" ON "mindmaps"("user_id");

-- CreateIndex
CREATE INDEX "mindmaps_project_id_idx" ON "mindmaps"("project_id");

-- AddForeignKey
ALTER TABLE "mindmaps" ADD CONSTRAINT "mindmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mindmaps" ADD CONSTRAINT "mindmaps_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
