import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { computeJobStats } from "@/lib/job-stats";
import { StatsView } from "@/components/jobs/stats-view/stats-view";

/**
 * Public, unlisted job stats page. Reached only via the owner's secret
 * /share/[token] link; hidden from search engines via metadata, robots.txt,
 * and an X-Robots-Tag header.
 */
export const metadata: Metadata = {
  title: "Job Hunt Stats",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const user = await prisma.user.findUnique({
    where: { shareToken: token },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  const jobs = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    include: { interviews: true },
    orderBy: { createdAt: "desc" },
  });

  const stats = computeJobStats(jobs, "1y");
  const updated = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 p-2.5">
              <Briefcase className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Job Hunt Stats
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Shared read-only · last 52 weeks · updated {updated}
              </p>
            </div>
          </div>
        </div>

        <StatsView stats={stats} variant="public" />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Tracked with Zotes
        </p>
      </div>
    </div>
  );
}
