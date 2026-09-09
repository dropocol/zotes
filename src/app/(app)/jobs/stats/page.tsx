import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { JobViewLayout, JobStatsView } from "@/components/jobs";
import { computeJobStats } from "@/lib/job-stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Statistics",
  description: "Analyze your job search progress",
};

export const dynamic = "force-dynamic";

export default async function JobStatsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [initialJobs, user] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      include: { interviews: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { shareToken: true },
    }),
  ]);

  const initialStats = computeJobStats(initialJobs, "1y");

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Jobs", href: "/jobs" },
        { title: "Stats", href: "/jobs/stats" },
      ]}
    >
      <JobViewLayout initialJobs={initialJobs} initialStats={initialStats}>
        <JobStatsView shareToken={user?.shareToken ?? null} />
      </JobViewLayout>
    </DashboardLayout>
  );
}
