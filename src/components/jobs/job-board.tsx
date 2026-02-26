"use client";

import * as React from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewSwitcher } from "./shared/view-switcher";
import { JobForm } from "./job-form/job-form";
import { JobDetailsSheet } from "./job-form/job-details-sheet";
import { ListView } from "./list-view/list-view";
import { KanbanView } from "./kanban-view/kanban-view";
import { CalendarView } from "./calendar-view/calendar-view";
import { StatsView } from "./stats-view/stats-view";
import { JobBoardViewType, JobBoardView } from "@/types/jobs";
import type {
  JobApplication,
  JobInterview,
  JobApplicationStatus,
} from "@prisma/client";

interface InterviewWithJob extends JobInterview {
  jobApplication: Pick<JobApplication, "jobTitle" | "companyName">;
}

interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

interface JobBoardProps {
  initialJobs?: JobWithInterviews[];
  initialStats?: {
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
    responseRateBySource: Record<
      string,
      { total: number; responded: number; rate: number }
    >;
  } | null;
}

export function JobBoard({
  initialJobs = [],
  initialStats = null,
}: JobBoardProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Read initial state from URL params - only once on mount
  const getInitialView = React.useCallback((): JobBoardViewType => {
    const viewParam = searchParams.get("view");
    if (
      viewParam &&
      Object.values(JobBoardView).includes(viewParam as JobBoardViewType)
    ) {
      return viewParam as JobBoardViewType;
    }
    return JobBoardView.LIST;
  }, [searchParams]);

  const [view, setView] = React.useState<JobBoardViewType>(getInitialView);
  const [jobs, setJobs] = React.useState<JobWithInterviews[]>(initialJobs);
  const [stats, setStats] = React.useState(initialStats);
  const [statsRange, setStatsRange] = React.useState("month");
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = React.useState(false);

  // Form state
  const [showJobForm, setShowJobForm] = React.useState(false);
  const [editingJob, setEditingJob] = React.useState<JobWithInterviews | null>(
    null,
  );

  // Details sheet state
  const [selectedJob, setSelectedJob] =
    React.useState<JobWithInterviews | null>(null);

  // Track previous view to avoid unnecessary URL updates
  const previousViewRef = React.useRef(view);

  // Fetch jobs
  const fetchJobs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = React.useCallback(async (range: string) => {
    try {
      const response = await fetch(`/api/jobs/stats?range=${range}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Initial fetch - only once
  React.useEffect(() => {
    if (hasInitiallyFetched) return;

    const needsFetch = initialJobs.length === 0 || !initialStats;
    if (needsFetch) {
      setHasInitiallyFetched(true);
      if (initialJobs.length === 0) {
        fetchJobs();
      }
      if (!initialStats) {
        fetchStats(statsRange);
      }
    }
  }, [
    hasInitiallyFetched,
    initialJobs.length,
    initialStats,
    fetchJobs,
    fetchStats,
    statsRange,
  ]);

  // Fetch stats when range changes
  React.useEffect(() => {
    if (hasInitiallyFetched) {
      fetchStats(statsRange);
    }
  }, [statsRange, fetchStats, hasInitiallyFetched]);

  // Update URL when view changes - only if view actually changed
  React.useEffect(() => {
    if (previousViewRef.current !== view) {
      previousViewRef.current = view;
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [view, pathname, router, searchParams]);

  const handleViewChange = (newView: JobBoardViewType) => {
    if (newView !== view) {
      setView(newView);
    }
  };

  const handleJobClick = (job: JobWithInterviews) => {
    setSelectedJob(job);
  };

  const handleEditJob = () => {
    setEditingJob(selectedJob);
    setShowJobForm(true);
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSelectedJob(null);
        fetchJobs();
        fetchStats(statsRange);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleJobFormSuccess = () => {
    setShowJobForm(false);
    setEditingJob(null);
    setSelectedJob(null);
    fetchJobs();
    fetchStats(statsRange);
  };

  const handleStatusChange = async (
    jobId: string,
    newStatus: JobApplicationStatus,
  ) => {
    // Optimistic update
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId ? { ...job, status: newStatus } : job,
      ),
    );

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        fetchJobs();
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      fetchJobs();
    }
  };

  // Get all interviews for calendar view
  const allInterviews: InterviewWithJob[] = React.useMemo(() => {
    return jobs.flatMap((job) =>
      job.interviews.map((interview) => ({
        ...interview,
        jobApplication: {
          jobTitle: job.jobTitle,
          companyName: job.companyName,
        },
      })),
    );
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-lg shadow-emerald-500/25">
            <Briefcase className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Job Applications
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your job search progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onViewChange={handleViewChange} />
          <Button onClick={() => setShowJobForm(true)}>
            <Plus className="size-4 mr-2" />
            Add Job
          </Button>
        </div>
      </div>

      {/* Views */}
      {/* <div className="rounded-xl bg-card border shadow-sm p-4 md:p-6"> */}
      {isLoading && jobs.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {view === JobBoardView.LIST && (
            <ListView jobs={jobs} onJobClick={handleJobClick} />
          )}

          {view === JobBoardView.KANBAN && (
            <KanbanView
              jobs={jobs}
              onJobClick={handleJobClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {view === JobBoardView.CALENDAR && (
            <CalendarView interviews={allInterviews} />
          )}

          {view === JobBoardView.STATS && (
            <StatsView
              stats={stats}
              range={statsRange}
              onRangeChange={setStatsRange}
            />
          )}
        </>
      )}
      {/* </div> */}

      {/* Job Form Dialog */}
      <JobForm
        open={showJobForm}
        onOpenChange={(open) => {
          setShowJobForm(open);
          if (!open) setEditingJob(null);
        }}
        job={editingJob}
        onSuccess={handleJobFormSuccess}
      />

      {/* Job Details Sheet */}
      <JobDetailsSheet
        open={!!selectedJob && !showJobForm}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
        job={selectedJob}
        onEdit={handleEditJob}
        onDelete={handleDeleteJob}
        onUpdate={() => {
          fetchJobs();
          fetchStats(statsRange);
        }}
      />
    </div>
  );
}
