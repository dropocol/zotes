"use client";

import * as React from "react";
import { JobsProvider, JobWithInterviews } from "./job-context";

interface JobStats {
  range: string;
  summary: {
    total: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    respondedYes: number;
    respondedNo: number;
    pending: number;
    totalInterviews: number;
    jobsWithInterviews: number;
  };
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byMethod: Record<string, number>;
  applicationsOverTime: Record<string, number>;
  responseRateBySource: Record<string, { total: number; responded: number; rate: number }>;
}

interface JobViewLayoutProps {
  children: React.ReactNode;
  initialJobs?: JobWithInterviews[];
  initialStats?: JobStats | null;
}

export function JobViewLayout({ children, initialJobs, initialStats }: JobViewLayoutProps) {
  return (
    <JobsProvider initialJobs={initialJobs} initialStats={initialStats}>
      <div className="space-y-6">{children}</div>
    </JobsProvider>
  );
}
