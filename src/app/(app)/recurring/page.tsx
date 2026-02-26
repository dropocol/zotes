import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RecurringWeeklyViewClient } from "./client";
import { getWeekStart, getWeekEnd } from "@/types/recurring";
import { Loader2 } from "lucide-react";

export default async function RecurringPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get the current week's date range
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);

  // Fetch recurring todo items with their completions for the current week
  const recurringItems = await prisma.todoItem.findMany({
    where: {
      userId: session.user.id,
      isRecurring: true,
      parentId: null,
    },
    include: {
      completions: {
        where: {
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Serialize dates for client component
  const serializedItems = recurringItems.map((item) => ({
    id: item.id,
    title: item.title,
    frequency: item.frequency,
    daysOfWeek: item.daysOfWeek,
    recurrenceStart: item.recurrenceStart?.toISOString(),
    recurrenceEnd: item.recurrenceEnd?.toISOString(),
    completions: item.completions.map((c) => ({
      id: c.id,
      date: c.date.toISOString(),
      status: c.status,
    })),
  }));

  return (
    <DashboardLayout breadcrumbs={[{ title: "Recurring", href: "/recurring" }]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Recurring Tasks</h1>
          <p className="text-muted-foreground">
            Track your recurring tasks throughout the week
          </p>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <RecurringWeeklyViewClient initialItems={serializedItems} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
