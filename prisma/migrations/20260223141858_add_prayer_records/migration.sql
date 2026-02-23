-- CreateEnum
CREATE TYPE "PrayerType" AS ENUM ('FAJR', 'ZOHAR', 'ASR', 'MAGHRIB', 'ISHA', 'JUMAH');

-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('YES', 'NO', 'QAZAA');

-- CreateTable
CREATE TABLE "prayer_records" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "prayer" "PrayerType" NOT NULL,
    "status" "PrayerStatus" NOT NULL DEFAULT 'NO',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_records_user_id_idx" ON "prayer_records"("user_id");

-- CreateIndex
CREATE INDEX "prayer_records_date_idx" ON "prayer_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_records_user_id_date_prayer_key" ON "prayer_records"("user_id", "date", "prayer");

-- AddForeignKey
ALTER TABLE "prayer_records" ADD CONSTRAINT "prayer_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
