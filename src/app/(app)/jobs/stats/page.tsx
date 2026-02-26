import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard-layout";
import { JobViewLayout, JobStatsView } from "@/components/jobs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Statistics",
  description: "Analyze your job search progress",
};

export const dynamic = "force-dynamic";

async function getJobs(userId: string) {
  const jobs = await prisma.jobApplication.findMany({
    where: { userId },
    include: {
      interviews: true,
    },
  });

  return jobs;
}

async function getStats(userId: string) {
  const jobs = await prisma.jobApplication.findMany({
    where: { userId },
    include: { interviews: true },
  });

  const total = jobs.length;
  const byStatus = {
    saved: jobs.filter((j) => j.status === "SAVED").length,
    applied: jobs.filter((j) => j.status === "APPLIED").length,
    phoneScreen: jobs.filter((j) => j.status === "PHONE_SCREEN").length,
    interview: jobs.filter((j) => j.status === "INTERVIEW").length,
    offer: jobs.filter((j) => j.status === "OFFER").length,
    rejected: jobs.filter((j) => j.status === "REJECTED").length,
    withdrawn: jobs.filter((j) => j.status === "WITHDRAWN").length,
    noResponse: jobs.filter((j) => j.status === "NO_RESPONSE").length,
  };

  const bySource = {
    linkedin: jobs.filter((j) => j.source === "LINKEDIN").length,
    slack: jobs.filter((j) => j.source === "SLACK").length,
    facebook: jobs.filter((j) => j.source === "FACEBOOK").length,
    x: jobs.filter((j) => j.source === "X").length,
    companyWebsite: jobs.filter((j) => j.source === "COMPANY_WEBSITE").length,
    referral: jobs.filter((j) => j.source === "REFERRAL").length,
    jobBoard: jobs.filter((j) => j.source === "JOB_BOARD").length,
    other: jobs.filter((j) => j.source === "OTHER").length,
  };

  const byMethod = {
    email: jobs.filter((j) => j.applicationMethod === "EMAIL").length,
    webPortal: jobs.filter((j) => j.applicationMethod === "WEB_PORTAL").length,
    linkedinEasyApply: jobs.filter((j) => j.applicationMethod === "LINKEDIN_EASY_APPLY").length,
    referral: jobs.filter((j) => j.applicationMethod === "REFERRAL").length,
  };

  const respondedYes = jobs.filter((j) => j.responseReceived === "YES").length;
  const respondedNo = jobs.filter((j) => j.responseReceived === "NO").length;
  const pending = jobs.filter((j) => j.responseReceived === "PENDING").length;
  const responseRate = total > 0 ? Math.round((respondedYes / total) * 100) : 0;

  const totalInterviews = jobs.reduce((sum, job) => sum + job.interviews.length, 0);
  const jobsWithInterviews = jobs.filter((j) => j.interviews.length > 0).length;
  const interviewRate = total > 0 ? Math.round((jobsWithInterviews / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((byStatus.offer / total) * 100) : 0;

  const responseRateBySource: Record<string, { total: number; responded: number; rate: number }> = {};
  jobs.forEach((job) => {
    if (!responseRateBySource[job.source]) {
      responseRateBySource[job.source] = { total: 0, responded: 0, rate: 0 };
    }
    responseRateBySource[job.source].total++;
    if (job.responseReceived === "YES") {
      responseRateBySource[job.source].responded++;
    }
  });

  Object.keys(responseRateBySource).forEach((source) => {
    const data = responseRateBySource[source];
    data.rate = data.total > 0 ? Math.round((data.responded / data.total) * 100) : 0;
  });

  return {
    range: "month",
    summary: {
      total,
      responseRate,
      interviewRate,
      offerRate,
      respondedYes,
      respondedNo,
      pending,
      totalInterviews,
      jobsWithInterviews,
    },
    byStatus,
    bySource,
    byMethod,
    applicationsOverTime: {},
    responseRateBySource,
  };
}

export default async function JobStatsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [initialJobs, initialStats] = await Promise.all([
    getJobs(session.user.id),
    getStats(session.user.id),
  ]);

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Jobs", href: "/jobs" },
        { title: "Stats", href: "/jobs/stats" },
      ]}
    >
      <JobViewLayout initialJobs={initialJobs} initialStats={initialStats}>
        <JobStatsView />
      </JobViewLayout>
    </DashboardLayout>
  );
}
