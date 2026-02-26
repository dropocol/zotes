import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { RecurringWeeklyViewClient } from "./client";
import { getWeekStart, getWeekEnd } from "@/types/recurring";
import { Loader2, ArrowLeft, Repeat } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ taskId?: string; date?: string }>;
}

export default async function RecurringPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { taskId } = await searchParams;

  // Get the current week's date range
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);

  // Build where clause
  const where: {
    userId: string;
    isRecurring: boolean;
    parentId: null;
    id?: string;
  } = {
    userId: session.user.id,
    isRecurring: true,
    parentId: null,
  };

  // Filter by taskId if provided
  if (taskId) {
    where.id = taskId;
  }

  // Fetch recurring todo items with their completions for the current week
  const recurringItems = await prisma.todoItem.findMany({
    where,
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

  // Get the task title if filtering by taskId
  const taskTitle = taskId && recurringItems.length > 0 ? recurringItems[0].title : null;

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

  const breadcrumbs = [
    { title: "Recurring", href: "/recurring" },
    ...(taskTitle ? [{ title: taskTitle }] : []),
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={taskTitle || "Recurring"}
          description={
            taskTitle
              ? "Track progress and navigate through weeks"
              : "Track your recurring tasks throughout the week"
          }
          icon={Repeat}
        >
          {taskId && (
            <Link href="/recurring">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                View All Tasks
              </Button>
            </Link>
          )}
        </PageHeader>
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <RecurringWeeklyViewClient
            initialItems={serializedItems}
            singleTaskMode={!!taskId}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
