"use client";

import { useJobs, JobViewHeader } from "./job-context";
import { ListView } from "./list-view/list-view";
import { KanbanView } from "./kanban-view/kanban-view";
import { CalendarView } from "./calendar-view/calendar-view";
import { StatsView } from "./stats-view/stats-view";

export function JobListView() {
  const { jobs, isLoading, handleJobClick } = useJobs();

  if (isLoading && jobs.length === 0) {
    return (
      <>
        <JobViewHeader title="Job List" subtitle="All your job applications in one place" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <JobViewHeader title="Job List" subtitle="All your job applications in one place" />
      <ListView jobs={jobs} onJobClick={handleJobClick} />
    </>
  );
}

export function JobKanbanView() {
  const { jobs, isLoading, handleJobClick, handleStatusChange } = useJobs();

  if (isLoading && jobs.length === 0) {
    return (
      <>
        <JobViewHeader title="Kanban Board" subtitle="Drag and drop to manage your pipeline" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <JobViewHeader title="Kanban Board" subtitle="Drag and drop to manage your pipeline" />
      <KanbanView
        jobs={jobs}
        onJobClick={handleJobClick}
        onStatusChange={handleStatusChange}
      />
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
