"use client";

import * as React from "react";
import { JobsProvider, JobWithInterviews } from "./job-context";
import type { JobStats } from "@/types/jobs";

export type { JobStats };

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
