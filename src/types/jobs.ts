// ============================================================================
// JOB APPLICATION TYPES
// ============================================================================

// Re-export from Prisma generated types
import type {
  JobSource,
  ApplicationMethod,
  JobApplicationStatus,
  ResponseStatus,
  InterviewType,
} from "@prisma/client";

export type {
  JobSource,
  ApplicationMethod,
  JobApplicationStatus,
  ResponseStatus,
  InterviewType,
};

// ============================================================================
// CONSTANTS FOR DROPDOWNS
// ============================================================================

export const JOB_SOURCES: JobSource[] = [
  "LINKEDIN",
  "SLACK",
  "FACEBOOK",
  "X",
  "COMPANY_WEBSITE",
  "REFERRAL",
  "JOB_BOARD",
  "OTHER",
];

export const APPLICATION_METHODS: ApplicationMethod[] = [
  "EMAIL",
  "WEB_PORTAL",
  "LINKEDIN_EASY_APPLY",
  "REFERRAL",
];

export const JOB_APPLICATION_STATUSES: JobApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "PHONE_SCREEN",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
  "NO_RESPONSE",
];

export const RESPONSE_STATUSES: ResponseStatus[] = ["YES", "NO", "PENDING"];

export const INTERVIEW_TYPES: InterviewType[] = [
  "PHONE",
  "VIDEO",
  "ONSITE",
  "TECHNICAL",
  "BEHAVIORAL",
  "FINAL",
];

// ============================================================================
// VIEW TYPES
// ============================================================================

export const JobBoardView = {
  LIST: "list",
  KANBAN: "kanban",
  CALENDAR: "calendar",
  STATS: "stats",
} as const;

export type JobBoardViewType =
  (typeof JobBoardView)[keyof typeof JobBoardView];

// ============================================================================
// KANBAN COLUMNS
// ============================================================================

export const KANBAN_COLUMNS: {
  id: string;
  title: string;
  statuses: JobApplicationStatus[];
}[] = [
  {
    id: "to-apply",
    title: "To Apply",
    statuses: ["SAVED"],
  },
  {
    id: "applied",
    title: "Applied",
    statuses: ["APPLIED", "NO_RESPONSE"],
  },
  {
    id: "in-progress",
    title: "In Progress",
    statuses: ["PHONE_SCREEN", "INTERVIEW"],
  },
  {
    id: "resolved",
    title: "Resolved",
    statuses: ["OFFER", "REJECTED", "WITHDRAWN"],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the display name for a job source
 */
export function getJobSourceDisplayName(source: JobSource): string {
  const names: Record<JobSource, string> = {
    LINKEDIN: "LinkedIn",
    SLACK: "Slack",
    FACEBOOK: "Facebook",
    X: "X (Twitter)",
    COMPANY_WEBSITE: "Company Website",
    REFERRAL: "Referral",
    JOB_BOARD: "Job Board",
    OTHER: "Other",
  };
  return names[source];
}

/**
 * Get the display name for an application method
 */
export function getApplicationMethodDisplayName(method: ApplicationMethod): string {
  const names: Record<ApplicationMethod, string> = {
    EMAIL: "Email",
    WEB_PORTAL: "Web Portal",
    LINKEDIN_EASY_APPLY: "LinkedIn Easy Apply",
    REFERRAL: "Referral",
  };
  return names[method];
}

/**
 * Get the display name for a job application status
 */
export function getStatusDisplayName(status: JobApplicationStatus): string {
  const names: Record<JobApplicationStatus, string> = {
    SAVED: "Saved",
    APPLIED: "Applied",
    PHONE_SCREEN: "Phone Screen",
    INTERVIEW: "Interview",
    OFFER: "Offer",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
    NO_RESPONSE: "No Response",
  };
  return names[status];
}

/**
 * Get the color classes for a job application status
 */
export function getStatusColor(status: JobApplicationStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<
    JobApplicationStatus,
    { bg: string; text: string; border: string }
  > = {
    SAVED: {
      bg: "bg-slate-100 dark:bg-slate-900/30",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-700",
    },
    APPLIED: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-700",
    },
    PHONE_SCREEN: {
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
      text: "text-cyan-700 dark:text-cyan-300",
      border: "border-cyan-200 dark:border-cyan-700",
    },
    INTERVIEW: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-700",
    },
    OFFER: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-700",
    },
    REJECTED: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-700",
    },
    WITHDRAWN: {
      bg: "bg-gray-100 dark:bg-gray-900/30",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-200 dark:border-gray-700",
    },
    NO_RESPONSE: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-700",
    },
  };
  return colors[status];
}

/**
 * Get the color classes for a response status
 */
export function getResponseStatusColor(response: ResponseStatus): {
  bg: string;
  text: string;
} {
  const colors: Record<ResponseStatus, { bg: string; text: string }> = {
    YES: {
      bg: "bg-emerald-500",
      text: "text-white",
    },
    NO: {
      bg: "bg-red-500",
      text: "text-white",
    },
    PENDING: {
      bg: "bg-amber-500",
      text: "text-white",
    },
  };
  return colors[response];
}

/**
 * Format salary range for display
 */
export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency: string = "USD"
): string | null {
  if (!min && !max) return null;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  } else if (min) {
    return `From ${formatter.format(min)}`;
  } else if (max) {
    return `Up to ${formatter.format(max)}`;
  }
  return null;
}

/**
 * Get the display name for an interview type
 */
export function getInterviewTypeDisplayName(type: InterviewType): string {
  const names: Record<InterviewType, string> = {
    PHONE: "Phone",
    VIDEO: "Video",
    ONSITE: "On-site",
    TECHNICAL: "Technical",
    BEHAVIORAL: "Behavioral",
    FINAL: "Final",
  };
  return names[type];
}

/**
 * Get the icon name for a job source (for Lucide icons)
 */
export function getJobSourceIconName(source: JobSource): string {
  const icons: Record<JobSource, string> = {
    LINKEDIN: "Linkedin",
    SLACK: "MessageSquare",
    FACEBOOK: "Facebook",
    X: "Twitter",
    COMPANY_WEBSITE: "Building2",
    REFERRAL: "UserPlus",
    JOB_BOARD: "Briefcase",
    OTHER: "MoreHorizontal",
  };
  return icons[source];
}
