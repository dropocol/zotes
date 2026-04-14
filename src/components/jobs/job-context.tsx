"use client";

import * as React from "react";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobForm } from "./job-form/job-form";
import { JobDetailsSheet } from "./job-form/job-details-sheet";
import type {
  JobApplication,
  JobInterview,
  JobApplicationStatus,
} from "@prisma/client";

export interface InterviewWithJob extends JobInterview {
  jobApplication: Pick<JobApplication, "jobTitle" | "companyName">;
}

export interface JobWithInterviews extends JobApplication {
  interviews: JobInterview[];
}

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
  responseRateBySource: Record<
    string,
    { total: number; responded: number; rate: number }
  >;
}

interface JobsContextValue {
  jobs: JobWithInterviews[];
  stats: JobStats | null;
  statsRange: string;
  isLoading: boolean;
  allInterviews: InterviewWithJob[];
  fetchJobs: () => Promise<void>;
  fetchStats: (range: string) => Promise<void>;
  setStatsRange: (range: string) => void;
  handleJobClick: (job: JobWithInterviews) => void;
  handleStatusChange: (
    jobId: string,
    newStatus: JobApplicationStatus,
  ) => Promise<void>;
  showAddJobForm: () => void;
}

const JobsContext = React.createContext<JobsContextValue | null>(null);

export function useJobs() {
  const context = React.useContext(JobsContext);
  if (!context) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
}

interface JobsProviderProps {
  children: React.ReactNode;
  initialJobs?: JobWithInterviews[];
  initialStats?: JobStats | null;
}

export function JobsProvider({
  children,
  initialJobs = [],
  initialStats = null,
}: JobsProviderProps) {
  const [jobs, setJobs] = React.useState<JobWithInterviews[]>(initialJobs);
  const [stats, setStats] = React.useState<JobStats | null>(initialStats);
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

  // Fetch jobs
  const fetchJobs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        setJobs(data.data || data);
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
      if (initialJobs.length === 0) {
        fetchJobs();
      }
      if (!initialStats) {
        fetchStats(statsRange);
      }
    }
    // Mark as initialized regardless of whether we needed to fetch
    // This allows the range change effect to work
    setHasInitiallyFetched(true);
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
        fetchJobs();
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      fetchJobs();
    }
  };

  const showAddJobForm = () => {
    setEditingJob(null);
    setShowJobForm(true);
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

  const contextValue: JobsContextValue = {
    jobs,
    stats,
    statsRange,
    isLoading,
    allInterviews,
    fetchJobs,
    fetchStats,
    setStatsRange,
    handleJobClick,
    handleStatusChange,
    showAddJobForm,
  };

  return (
    <JobsContext.Provider value={contextValue}>
      {children}

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
    </JobsContext.Provider>
  );
}

// Header component for all job views
export function JobViewHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { showAddJobForm } = useJobs();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 p-2.5">
          <Briefcase className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {subtitle || "Track your job search progress"}
          </p>
        </div>
      </div>
      <Button onClick={showAddJobForm}>
        <Plus className="size-4 mr-2" />
        Add Job
      </Button>
    </div>
  );
}
