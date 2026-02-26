// Context and layout
export { JobsProvider, useJobs, JobViewHeader } from "./job-context";
export type { JobWithInterviews, InterviewWithJob } from "./job-context";
export { JobViewLayout } from "./job-view-layout";

// Views
export {
  JobListView,
  JobKanbanView,
  JobCalendarView,
  JobStatsView,
} from "./views";

// Shared components
export { StatusBadge } from "./shared/status-badge";
export { SourceIcon } from "./shared/source-icon";
export { ViewSwitcher } from "./shared/view-switcher";

// Job form
export { JobForm } from "./job-form/job-form";
export { JobDetailsSheet } from "./job-form/job-details-sheet";
export { InterviewForm } from "./job-form/interview-form";

// Individual views (for direct use)
export { ListView } from "./list-view/list-view";
export { KanbanView } from "./kanban-view/kanban-view";
export { CalendarView } from "./calendar-view/calendar-view";
export { StatsView } from "./stats-view/stats-view";

// Legacy export for backward compatibility
export { JobBoard } from "./job-board";
