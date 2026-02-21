-- CreateTable
CREATE TABLE "project_collaborators" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'collaborator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_collaborators_project_id_idx" ON "project_collaborators"("project_id");

-- CreateIndex
CREATE INDEX "project_collaborators_user_id_idx" ON "project_collaborators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_collaborators_project_id_user_id_key" ON "project_collaborators"("project_id", "user_id");

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
