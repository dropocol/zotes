-- AlterTable
ALTER TABLE "todo_items" ADD COLUMN     "days_of_week" TEXT,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "is_recurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrence_end" TIMESTAMP(3),
ADD COLUMN     "recurrence_start" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "recurring_completions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "todo_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_completions_user_id_idx" ON "recurring_completions"("user_id");

-- CreateIndex
CREATE INDEX "recurring_completions_date_idx" ON "recurring_completions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_completions_user_id_date_todo_item_id_key" ON "recurring_completions"("user_id", "date", "todo_item_id");

-- AddForeignKey
ALTER TABLE "recurring_completions" ADD CONSTRAINT "recurring_completions_todo_item_id_fkey" FOREIGN KEY ("todo_item_id") REFERENCES "todo_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_completions" ADD CONSTRAINT "recurring_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
