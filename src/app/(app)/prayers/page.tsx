import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PrayerCalendar } from "@/components/prayers";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prayers",
  description: "Track your daily prayers",
};

export const dynamic = "force-dynamic";

async function getPrayerRecords(userId: string) {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const records = await prisma.prayerRecord.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: [{ date: "asc" }, { prayer: "asc" }],
  });

  return records.map((r) => ({
    id: r.id,
    date: r.date,
    prayer: r.prayer,
    status: r.status,
  }));
}

export default async function PrayersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const initialRecords = await getPrayerRecords(session.user.id);

  return (
    <DashboardLayout breadcrumbs={[{ title: "Prayers", href: "/prayers" }]}>
      <PrayerCalendar initialRecords={initialRecords} />
    </DashboardLayout>
  );
}
