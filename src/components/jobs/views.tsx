"use client";

import React from "react";
import { useJobs, JobViewHeader } from "./job-context";
import { ListView } from "./list-view/list-view";
import { CalendarView } from "./calendar-view/calendar-view";
import { StatsView } from "./stats-view/stats-view";

export function JobListView() {
  const { handleJobClick } = useJobs();

  return (
    <>
      <JobViewHeader title="Job List" subtitle="All your job applications in one place" />
      <ListView onJobClick={handleJobClick} />
    </>
  );
}

export function JobCalendarView() {
  const { allInterviews, isLoading } = useJobs();

  if (isLoading && allInterviews.length === 0) {
    return (
      <>
        <JobViewHeader title="Interview Calendar" subtitle="View your scheduled interviews" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <JobViewHeader title="Interview Calendar" subtitle="View your scheduled interviews" />
      <CalendarView interviews={allInterviews} />
    </>
  );
}

export function JobStatsView() {
  const { stats, statsRange, setStatsRange, isLoading } = useJobs();

  if (isLoading && !stats) {
    return (
      <>
        <JobViewHeader title="Statistics" subtitle="Analyze your job search progress" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <JobViewHeader title="Statistics" subtitle="Analyze your job search progress" />
      <StatsView stats={stats} range={statsRange} onRangeChange={setStatsRange} />
    </>
  );
}
