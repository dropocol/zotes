"use client";

import React from "react";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { stats, statsRange, setStatsRange, isLoading, showAddJobForm } = useJobs();

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
      {/* Custom Header with Range Selector and Add Job Button on same line */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 p-2.5">
            <Briefcase className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
            <p className="text-sm text-muted-foreground">
              Analyze your job search progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statsRange} onValueChange={setStatsRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={showAddJobForm}>
            <Plus className="size-4 mr-2" />
            Add Job
          </Button>
        </div>
      </div>
      <StatsView stats={stats} />
    </>
  );
}
