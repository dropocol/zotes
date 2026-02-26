import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { JobViewLayout, JobListView } from "@/components/jobs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job List",
  description: "All your job applications in one place",
};

export const dynamic = "force-dynamic";

async function getJobs(userId: string) {
  const jobs = await prisma.jobApplication.findMany({
    where: { userId },
    include: {
      interviews: {
        orderBy: { scheduledAt: "asc" },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return jobs;
}

export default async function JobListPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const initialJobs = await getJobs(session.user.id);

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Jobs", href: "/jobs" },
        { title: "List", href: "/jobs/list" },
      ]}
    >
      <JobViewLayout initialJobs={initialJobs}>
        <JobListView />
      </JobViewLayout>
    </DashboardLayout>
  );
}
