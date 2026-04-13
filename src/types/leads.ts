// ============================================================================
// LEAD (CONTACT) TYPES
// ============================================================================

// Re-export from Prisma generated types
import type { LeadStatus } from "@prisma/client";

export type { LeadStatus };

// ============================================================================
// CONSTANTS FOR DROPDOWNS
// ============================================================================

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "REACHED_OUT",
  "REPLIED",
  "IN_CONVERSATION",
  "MEETING_SCHEDULED",
  "NOT_INTERESTED",
  "UNRESPONSIVE",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the display name for a lead status
 */
export function getLeadStatusDisplayName(status: LeadStatus): string {
  const names: Record<LeadStatus, string> = {
    NEW: "New",
    REACHED_OUT: "Reached Out",
    REPLIED: "Replied",
    IN_CONVERSATION: "In Conversation",
    MEETING_SCHEDULED: "Meeting Scheduled",
    NOT_INTERESTED: "Not Interested",
    UNRESPONSIVE: "Unresponsive",
  };
  return names[status];
}

/**
 * Get the color classes for a lead status
 */
export function getLeadStatusColor(status: LeadStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<
    LeadStatus,
    { bg: string; text: string; border: string }
  > = {
    NEW: {
      bg: "bg-slate-100 dark:bg-slate-900/30",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-700",
    },
    REACHED_OUT: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-700",
    },
    REPLIED: {
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
      text: "text-cyan-700 dark:text-cyan-300",
      border: "border-cyan-200 dark:border-cyan-700",
    },
    IN_CONVERSATION: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-700",
    },
    MEETING_SCHEDULED: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-700",
    },
    NOT_INTERESTED: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-200 dark:border-red-700",
    },
    UNRESPONSIVE: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-700",
    },
  };
  return colors[status];
}
